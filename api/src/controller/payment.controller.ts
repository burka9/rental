import { Database } from "../db"
import { Payment } from "../entities/Payment.entity"
import { PaymentSchedule } from "../entities/PaymentSchedule.entity"
import { LessThan } from "typeorm"

export const PaymentRepository = Database.getRepository(Payment)
export const PaymentScheduleRepository = Database.getRepository(PaymentSchedule)

export async function getPayments({
    skip = 0,
    take = 10,
    search = "",
    isVerified
  }: {
    skip?: number;
    take?: number;
    search?: string;
    isVerified?: string; // "true", "false", or undefined
  }): Promise<[Payment[], number]> {
    const query = PaymentRepository.createQueryBuilder("payment")
        .leftJoinAndSelect("payment.bank", "bank")

    // Apply search filter on name or phone
    if (search) {
    //   query.where("payment.referenceNumber LIKE :search OR tenant.phone LIKE :search", { 
      query.where("payment.referenceNumber LIKE :search", { 
        search: `%${search}%` 
      });
    }
  
    // Apply shareholder filter
    if (isVerified === "true" || isVerified === "false") {
      query.andWhere("tenant.isVerified = :isVerified", { 
        isVerified: isVerified === "true" 
      });
    }
  
    // Apply pagination
    query.skip(skip).take(take);
  
    // Execute query and return results with total count
    return query.getManyAndCount();
  }

export async function getPayment(id?: number) {
    if (id) {
        return PaymentRepository.findOne({
            where: { id },
            relations: ['lease', 'bank']
        })
    }
    return PaymentRepository.find({
        relations: ['lease', 'bank']
    })
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

    const newPayment = PaymentRepository.create({
        ...payment,
        paymentDate: new Date(),
        isVerified: false,
    })
    return await PaymentRepository.save(newPayment)
}

export async function verifyPayment(id: number, verificationData: Partial<Payment>) {
    const payment = await PaymentRepository.findOne({
        where: { id }
    })

    if (!payment) {
        throw new Error("Payment not found")
    }

    if (payment.isVerified) {
        throw new Error("Payment already verified")
    }

    await PaymentRepository.update(id, verificationData)
    return await PaymentRepository.findOne({
        where: { id },
        relations: ['lease', 'bank']
    })
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