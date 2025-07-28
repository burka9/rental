import { addMonths, isAfter, isBefore } from "date-fns"
import { Database } from "../db"
import { Lease } from "../entities/Lease.entity"
import { PaymentSchedule } from "../entities/PaymentSchedule.entity"
import { toEthiopian, toGregorian } from "../lib/date-converter"
import { GDate, EthDate } from "ethiopian-gregorian-date-converter"
import { reconcilePaymentsWithSchedules } from "./payment.controller"

export const LeaseRepository = Database.getRepository(Lease)
export const PaymentScheduleRepository = Database.getRepository(PaymentSchedule)

export async function getLease(id?: number, page: number = 1, limit: number = 10) {
    if (id) {
        return await LeaseRepository.findOne({
            where: { id, active: true },
            relations: {
                paymentSchedule: true,
                payments: true,
                tenant: true,
            }
        })
    }

    const skip = (page - 1) * limit;
    const [leases, total] = await LeaseRepository.findAndCount({
        skip,
        take: limit,
        relations: {
            paymentSchedule: true,
            payments: true,
            tenant: true
        }
    });

    return {
        leases,
        pagination: {
            total,
            page,
            limit,
        }
    };
}

export async function createLease(lease: Partial<Lease>) {
    return await Database.transaction(async transactionalEntityManager => {
        const newLease = LeaseRepository.create({
            ...lease,
            active: true
        })
        const savedLease = await transactionalEntityManager.save(newLease)

        const schedules = await generatePaymentSchedule(savedLease)
        const savedSchedules = await transactionalEntityManager.save(PaymentSchedule, schedules)

        return await transactionalEntityManager.findOne(Lease, {
            where: { id: savedLease.id },
            relations: {
                paymentSchedule: true
            }
        })
    })
}

export async function updateLease(id: number, lease: Partial<Lease>) {
    const existingLease = await LeaseRepository.findOne({
        where: { id }
    })

    if (!existingLease) {
        throw new Error("Lease not found")
    }

    delete lease.tenantId
    delete lease.roomIds

    await LeaseRepository.update(id, lease)
    return await LeaseRepository.findOne({
        where: { id },
        relations: {
            paymentSchedule: true,
            payments: true
        }
    })
}

export async function deleteLease(id: number) {
    const lease = await LeaseRepository.findOne({
        where: { id }
    })

    if (!lease) {
        throw new Error("Lease not found")
    }

    lease.active = false
    return await LeaseRepository.save(lease)
}

// function generatePaymentSchedule(lease: Lease): Partial<PaymentSchedule>[] {
//     const { startDate, endDate, paymentIntervalInMonths: interval, paymentAmountPerMonth, initialPayment } = lease;
//     const paymentIntervalInMonths = Number(interval);
//     const schedule: Partial<PaymentSchedule>[] = [];
  
//     const ethStart = toEthiopian([startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate()]);
//     const ethEnd = toEthiopian([endDate.getFullYear(), endDate.getMonth() + 1, endDate.getDate()]);
  
//     let currentEthDate: [number, number, number] = [...ethStart];
//     let paymentDateGregorian = new Date(toGregorian(currentEthDate).join('-'));
//     const leaseEndGregorian = new Date(toGregorian(ethEnd).join('-'));
  
//     const totalAmountPerMonth = Object.values(paymentAmountPerMonth).reduce((sum, amount) => Number(sum) + (Number(amount) || 0), 0);
//     const intervalAmount = totalAmountPerMonth * paymentIntervalInMonths;
  
//     let payableAmount: number = Number(initialPayment?.amount ?? 0);
  
//     while (!isAfter(paymentDateGregorian, leaseEndGregorian)) {
//         const currentEth = toEthiopian([
//             paymentDateGregorian.getFullYear(),
//             paymentDateGregorian.getMonth() + 1,
//             paymentDateGregorian.getDate(),
//         ]);
  
//         if (currentEth[1] === 13) {
//             currentEthDate = [currentEth[0] + 1, 1, currentEth[2] || 1];
//             paymentDateGregorian = new Date(toGregorian(currentEthDate).join('-'));
//             continue;
//         }
  
//         let nextEthMonth = currentEth[1] + paymentIntervalInMonths;
//         let nextEthYear = currentEth[0];
//         while (nextEthMonth > 12) {
//             nextEthMonth -= 12;
//             nextEthYear += 1;
//         }
//         const nextEthDate: [number, number, number] = [nextEthYear, nextEthMonth, currentEth[2] || 1];
//         const nextPaymentDateGregorian = new Date(toGregorian(nextEthDate).join('-'));
  
//         let paid = 0;
//         if (payableAmount > 0) {
//             paid = Math.min(payableAmount, intervalAmount);
//             payableAmount -= paid;
//         }
  
//         if (!isBefore(nextPaymentDateGregorian, leaseEndGregorian)) {
//             let ethMonthsRemaining = (ethEnd[0] - currentEth[0]) * 12 + (ethEnd[1] - currentEth[1]);
//             if (ethEnd[2] > currentEth[2]) ethMonthsRemaining += 1;
//             if (ethEnd[1] === 13) ethMonthsRemaining -= 1;
  
//             const finalAmount = totalAmountPerMonth * Math.max(ethMonthsRemaining, 1);
//             schedule.push({
//                 dueDate: new Date(paymentDateGregorian),
//                 payableAmount: finalAmount,
//                 leaseId: lease.id,
//                 lease,
//                 paidAmount: paid,
//                 paymentDate: paid !== 0 ? new Date(paymentDateGregorian) : undefined,
//             });
//             break;
//         }
  
//         schedule.push({
//             dueDate: new Date(paymentDateGregorian),
//             payableAmount: intervalAmount,
//             leaseId: lease.id,
//             lease,
//             paidAmount: paid,
//             paymentDate: paid !== 0 ? new Date(paymentDateGregorian) : undefined,
//         });
  
//         currentEthDate = nextEthDate;
//         paymentDateGregorian = nextPaymentDateGregorian;
//     }
  
//     return schedule;
// }

export async function generatePaymentSchedule(lease: Lease) {
    const { startDate, endDate, paymentIntervalInMonths: interval, paymentAmountPerMonth, initialPayment } = lease;

    if (!startDate || !endDate) {
        throw new Error(`Lease ${lease.id} is missing startDate or endDate`);
    }

    const paymentIntervalInMonths = Number(interval);
    if (!paymentIntervalInMonths || paymentIntervalInMonths < 1) {
        throw new Error(`Invalid payment interval for lease ${lease.id}`);
    }

    const schedule: Partial<PaymentSchedule>[] = [];

    const ethStart = new GDate(startDate.toISOString().split('T')[0]).toEth();
    const ethEnd = new GDate(endDate.toISOString().split('T')[0]).toEth();

    let currentEthDate = new EthDate(ethStart.year, ethStart.month, ethStart.day);
    let paymentDateGregorian = currentEthDate.toGreg();
    const leaseEndGregorian = ethEnd.toGreg();

    const totalAmountPerMonth = Object.values(paymentAmountPerMonth).reduce(
        (sum, amount) => sum + (Number(amount) || 0),
        0
    );
    const intervalAmount = totalAmountPerMonth * paymentIntervalInMonths;

    let payableAmount: number = Number(initialPayment?.amount ?? 0);

    // 🔐 infinite loop protection
    let loopCount = 0;
    const MAX_ITERATIONS = 500;

    while (!isAfter(paymentDateGregorian, leaseEndGregorian)) {
        if (loopCount++ > MAX_ITERATIONS) {
            throw new Error(`Loop exceeded max iterations for lease ${lease.id}`);
        }

        const currentEth = paymentDateGregorian.toEth();

        // Skip Pagume
        if (currentEth.month === 13) {
            currentEthDate = new EthDate(currentEth.year + 1, 1, currentEth.day || 1);
            paymentDateGregorian = currentEthDate.toGreg();
            continue;
        }

        // Advance by N months
        let nextEthMonth = currentEth.month + paymentIntervalInMonths;
        let nextEthYear = currentEth.year;
        while (nextEthMonth > 12) {
            nextEthMonth -= 12;
            nextEthYear += 1;
        }

        const nextEthDate = new EthDate(nextEthYear, nextEthMonth, currentEth.day || 1);
        const nextPaymentDateGregorian = nextEthDate.toGreg();

        let paid = 0;
        if (payableAmount > 0) {
            paid = Math.min(payableAmount, intervalAmount);
            payableAmount -= paid;
        }

        // Handle final chunk
        if (!isBefore(nextPaymentDateGregorian, leaseEndGregorian)) {
            let ethMonthsRemaining = (ethEnd.year - currentEth.year) * 12 + (ethEnd.month - currentEth.month);
            if (ethEnd.day > currentEth.day) ethMonthsRemaining += 1;
            if (ethEnd.month === 13) ethMonthsRemaining -= 1;

            const finalAmount = totalAmountPerMonth * Math.max(ethMonthsRemaining, 1);

            schedule.push({
                dueDate: new Date(paymentDateGregorian),
                payableAmount: finalAmount,
                leaseId: lease.id,
                lease,
                paidAmount: paid,
                paymentDate: paid !== 0 ? new Date(paymentDateGregorian) : undefined,
            });
            break;
        }

        // Add regular interval payment
        schedule.push({
            dueDate: new Date(paymentDateGregorian),
            payableAmount: intervalAmount,
            leaseId: lease.id,
            lease,
            paidAmount: paid,
            paymentDate: paid !== 0 ? new Date(paymentDateGregorian) : undefined,
        });

        currentEthDate = nextEthDate;
        paymentDateGregorian = nextPaymentDateGregorian;
    }

    return schedule;
}


export async function regeneratePaymentSchedule(leaseId: number) {
    const lease = await LeaseRepository.findOne({ where: { id: leaseId } })
    if (!lease) {
        throw new Error("Lease not found")
    }
    
    // remove existing payment schedules
    await PaymentScheduleRepository.delete({ leaseId: lease.id })
    
    const schedule = await generatePaymentSchedule(lease)
    await PaymentScheduleRepository.save(schedule)

    await reconcilePaymentsWithSchedules(lease)

    return await PaymentScheduleRepository.find({
        where: { leaseId },
        relations: ['lease']
    })
}

export async function getLeasesByTenant(tenantId: number) {
    return await LeaseRepository.find({
        where: { tenantId },
        relations: {
            paymentSchedule: true,
            payments: true
        }
    })
}

export async function getActiveLeases() {
    return await LeaseRepository.find({
        where: { active: true },
        relations: {
            paymentSchedule: true,
            payments: true
        }
    })
}



import { LessThan } from "typeorm";

export async function resetAndReconcileSchedules(leaseId: number, cutoffDate: Date) {
    const lease = await LeaseRepository.findOne({ where: { id: leaseId } });
    if (!lease) throw new Error(`Lease ${leaseId} not found`);

    // Delete old schedules before cutoff
    await PaymentScheduleRepository.delete({
        leaseId,
        dueDate: LessThan(cutoffDate),
    });

    // Reconcile based on remaining schedules and verified payments
    const updatedSchedules = await reconcilePaymentsWithSchedules(lease);

    return {
        success: true,
        message: `Old schedules deleted and payments reconciled for lease ${leaseId}`,
        remainingSchedules: updatedSchedules,
    };
}
