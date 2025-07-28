import { Database } from "../db"
import { Payment } from "../entities/Payment.entity"
import { PaymentSchedule } from "../entities/PaymentSchedule.entity"
import { In, LessThan } from "typeorm"
import { Room } from "../entities/Room.entity"
import logger from "../lib/logger"
import { Lease } from "../entities/Lease.entity"

export const PaymentRepository = Database.getRepository(Payment)
export const PaymentScheduleRepository = Database.getRepository(PaymentSchedule)
export const RoomRepository = Database.getRepository(Room)

export async function getPayments({
    skip = 0,
    take = 10,
    search = "",
    isVerified,
    startDate,
    endDate
  }: {
    skip?: number;
    take?: number;
    search?: string;
    isVerified?: string; // "true", "false", or undefined
    startDate?: string;
    endDate?: string;
  }): Promise<[Payment[], number]> {
    const query = PaymentRepository.createQueryBuilder("payment")
      .leftJoinAndSelect("payment.bank", "bank");

    // Apply search filter on reference number
    if (search) {
      query.andWhere("payment.referenceNumber LIKE :search", { 
        search: `%${search}%` 
      });
    }
  
    // Apply verification filter
    if (isVerified === "true" || isVerified === "false") {
      query.andWhere("payment.isVerified = :isVerified", { 
        isVerified: isVerified === "true" 
      });
    }

    // Apply date range filter
    if (startDate) {
      query.andWhere("payment.paymentDate >= :startDate", { 
        startDate: new Date(startDate) 
      });
    }
    
    if (endDate) {
      // Set end of day for end date
      const endOfDay = new Date(endDate);
      endOfDay.setHours(23, 59, 59, 999);
      query.andWhere("payment.paymentDate <= :endDate", { 
        endDate: endOfDay 
      });
    }
  
    // Apply pagination and order by payment date descending
    query
      .orderBy("payment.paymentDate", "DESC")
      .skip(skip)
      .take(take);
  
    // Execute query and return results with total count
    return query.getManyAndCount();
  }

  export async function getPayment(id?: number) {
    if (id) {
        const payment: any = await PaymentRepository.createQueryBuilder("payment")
            .leftJoinAndSelect("payment.bank", "bank")
            .leftJoinAndSelect("payment.lease", "lease")
            .leftJoinAndSelect("lease.tenant", "tenant")
            .where("payment.id = :id", { id })
            .getOne();

        if (!payment) {
            throw new Error(`Payment with ID ${id} not found`);
        }

        // Fetch rooms associated with the lease's roomIds
        if (payment.lease && payment.lease.roomIds && payment.lease.roomIds.length > 0) {
            const rooms = await RoomRepository.find({
                where: { id: In(payment.lease.roomIds) },
            });
            // Attach rooms to the lease object to match the structure expected by verifyPayment.tsx
            payment.lease.rooms = rooms;
        } else {
            payment.lease.rooms = [];
        }

        return payment;
    }

    const payments: any[] = await PaymentRepository.find({
        relations: ['lease', 'lease.tenant', 'bank'],
    });

    // Fetch rooms for each payment's lease
    for (const payment of payments) {
        if (payment.lease && payment.lease.roomIds && payment.lease.roomIds.length > 0) {
            const rooms = await RoomRepository.find({
                where: { id: In(payment.lease.roomIds) },
            });
            payment.lease.rooms = rooms;
        } else {
            payment.lease.rooms = [];
        }
    }

    return payments;
}

export async function getOverduePaymentSchedule() {
    const schedules = await PaymentScheduleRepository.find({
        where: {
            dueDate: LessThan(new Date())
        },
        relations: ['lease']
    })

    return schedules
}

export async function createPayment(payment: Partial<Payment>) {
    if (!payment.leaseId || !payment.bankId || !payment.paidAmount) {
        throw new Error("Missing required fields")
    }

    logger.debug(payment)
    
    const newPayment = PaymentRepository.create({
        leaseId: payment.leaseId,
        paidAmount: payment.paidAmount,
        paymentDate: new Date(),
        bankId: payment.bankId,
        referenceNumber: payment.referenceNumber,
        notes: payment.notes,
        bankSlipPath: payment.bankSlipPath,
    })
    
    return await PaymentRepository.save(newPayment)
}

export async function verifyPayment(id: number, verificationData: Partial<Payment>) {
    logger.debug(verificationData)

    const payment = await PaymentRepository.findOne({
        where: { id },
        relations: ['lease', 'bank']
    });

    if (!payment) {
        throw new Error("Payment not found");
    }

    if (payment.isVerified) {
        throw new Error("Payment already verified");
    }

    // Update payment with verification data
    await PaymentRepository.update(id, {
        invoicePath: verificationData.invoicePath,
        invoiceNumber: verificationData.invoiceNumber,
        isVerified: true,
        verifiedAt: new Date(),
    });

    // Fetch the updated payment
    const updatedPayment = await PaymentRepository.findOne({
        where: { id },
        relations: ['lease', 'bank']
    });

    if (!updatedPayment) {
        throw new Error("Failed to fetch updated payment");
    }

    // Distribute the payment to the PaymentSchedule entries
    let remainingPayment = updatedPayment.paidAmount;
    const leaseId = updatedPayment.leaseId;

    // Use query builder to fetch unpaid or partially paid schedules
    const schedules = await PaymentScheduleRepository
        .createQueryBuilder("schedule")
        .where("schedule.leaseId = :leaseId", { leaseId })
        .andWhere("schedule.paidAmount < schedule.payableAmount")
        .orderBy("schedule.dueDate", "ASC")
        .getMany();

    for (const schedule of schedules) {
        if (remainingPayment <= 0) break; // No more payment to distribute

        const remainingScheduleAmount = schedule.payableAmount - (schedule.paidAmount || 0);
        const amountToApply = Math.min(remainingPayment, remainingScheduleAmount);

        // Update the schedule
        schedule.paidAmount = (schedule.paidAmount || 0) + amountToApply;
        remainingPayment -= amountToApply;

        // If the schedule is fully paid, set the paymentDate
        if (schedule.paidAmount === schedule.payableAmount) {
            schedule.paymentDate = updatedPayment.paymentDate;
        }

        // Save the updated schedule
        await PaymentScheduleRepository.save(schedule);
    }

    return updatedPayment;
}

export async function changeStatus(scheduleId: number, paid: boolean) {
    const schedule = await PaymentScheduleRepository.findOne({
        where: { id: scheduleId }
    })

    if (!schedule) {
        throw new Error("Payment schedule not found")
    }

    console.log(paid)

    await PaymentScheduleRepository.update(scheduleId, { paidAmount: paid ? schedule.payableAmount : 0 })
    return await PaymentScheduleRepository.findOne({
        where: { id: scheduleId },
        relations: ['lease']
    })
}

export async function markPaidUntilNow(leaseId: number) {
    // for all schedules with leaseId, set paidAmount to payableAmount for all schedules that were not already paid until today
    const schedules = await PaymentScheduleRepository.find({
        where: { leaseId, dueDate: LessThan(new Date()) },
        relations: ['lease']
    })
    
    console.log(schedules)

    for (const schedule of schedules.splice(0, schedules.length-1)) {
        if (schedule.paidAmount < schedule.payableAmount) {
            await PaymentScheduleRepository.update(schedule.id, { paidAmount: schedule.payableAmount })
        }
    }

    return await PaymentScheduleRepository.find({
        where: { leaseId },
        relations: ['lease']
    })
}

export async function reconcilePaymentsWithSchedules(lease: Lease) {
    // Get all schedules for the lease
    const schedules = await PaymentScheduleRepository.find({
        where: { leaseId: lease.id },
        relations: ['lease'],
    });

    // Reset all schedule payment info first
    for (const schedule of schedules) {
        schedule.paidAmount = 0;
        schedule.paymentDate = undefined;
        await PaymentScheduleRepository.save(schedule);
    }

    // Get all verified payments for the lease
    const payments = await PaymentRepository.find({
        where: { leaseId: lease.id, isVerified: true },
        order: { paymentDate: 'ASC' }, // oldest payments first
        relations: ['lease'],
    });

    // Sort schedules by due date ascending
    const sortedSchedules = schedules.sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );

    for (const payment of payments) {
        let remainingAmount = payment.paidAmount;

        for (const schedule of sortedSchedules) {
            if (remainingAmount <= 0) break;

            const alreadyPaid = schedule.paidAmount || 0;
            const due = schedule.payableAmount - alreadyPaid;

            if (due <= 0) continue;

            const amountToApply = Math.min(remainingAmount, due);
            schedule.paidAmount = alreadyPaid + amountToApply;
            remainingAmount -= amountToApply;

            if (schedule.paidAmount === schedule.payableAmount) {
                schedule.paymentDate = payment.paymentDate;
            }

            await PaymentScheduleRepository.save(schedule);
        }
    }

    return sortedSchedules;
}
