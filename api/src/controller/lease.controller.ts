import { addMonths, isAfter, isBefore } from "date-fns"
import { Database } from "../db"
import { Lease } from "../entities/Lease.entity"
import { PaymentSchedule } from "../entities/PaymentSchedule.entity"
import { toEthiopian, toGregorian } from "../lib/date-converter"

export const LeaseRepository = Database.getRepository(Lease)
export const PaymentScheduleRepository = Database.getRepository(PaymentSchedule)

export async function getLease(id?: number) {
    if (id) {
        return await LeaseRepository.findOne({
            where: { id },
            relations: {
                paymentSchedule: true,
                payments: true
            }
        })
    }
    return await LeaseRepository.find({
        relations: {
            paymentSchedule: true,
            payments: true
        }
    })
}

export async function createLease(lease: Partial<Lease>) {
    // Start a transaction to ensure both lease and payment schedule are created
    return await Database.transaction(async transactionalEntityManager => {
        // Validate required fields
        // if (!lease.tenantId || !lease.partitionIds || !lease.startDate || !lease.endDate) {
        //     throw new Error("Missing required fields")
        // }

        // Create and save the lease
        const newLease = LeaseRepository.create({
            ...lease,
            active: true // New leases are active by default
        })
        const savedLease = await transactionalEntityManager.save(newLease)

        // Generate payment schedule based on lease terms
        const schedules = generatePaymentSchedule(savedLease)
        const savedSchedules = await transactionalEntityManager.save(PaymentSchedule, schedules)

        // Return lease with payment schedule
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

    // Don't allow updating certain fields after creation
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
    // Soft delete - just mark as inactive
    const lease = await LeaseRepository.findOne({
        where: { id }
    })

    if (!lease) {
        throw new Error("Lease not found")
    }

    lease.active = false
    return await LeaseRepository.save(lease)
}

function generatePaymentSchedule(lease: Lease): Partial<PaymentSchedule>[] {
    const { startDate, endDate, paymentIntervalInMonths: interval, paymentAmountPerMonth, initialPayment } = lease;
    const paymentIntervalInMonths = Number(interval);
    const schedule: Partial<PaymentSchedule>[] = [];
  
    // Convert Gregorian startDate and endDate to Ethiopian
    const ethStart = toEthiopian([startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate()]);
    const ethEnd = toEthiopian([endDate.getFullYear(), endDate.getMonth() + 1, endDate.getDate()]);
  
    let currentEthDate: [number, number, number] = [...ethStart];
    let paymentDateGregorian = new Date(toGregorian(currentEthDate).join('-'));
    const leaseEndGregorian = new Date(toGregorian(ethEnd).join('-'));
  
    const totalAmountPerMonth = Object.values(paymentAmountPerMonth).reduce((sum, amount) => Number(sum) + (Number(amount) || 0), 0);
    const intervalAmount = totalAmountPerMonth * paymentIntervalInMonths;
  
    let payableAmount: number = Number(initialPayment?.amount ?? 0);
  
    while (!isAfter(paymentDateGregorian, leaseEndGregorian)) {
        const currentEth = toEthiopian([
            paymentDateGregorian.getFullYear(),
            paymentDateGregorian.getMonth() + 1,
            paymentDateGregorian.getDate(),
        ]);
  
        if (currentEth[1] === 13) {
            currentEthDate = [currentEth[0] + 1, 1, currentEth[2] || 1];
            paymentDateGregorian = new Date(toGregorian(currentEthDate).join('-'));
            continue;
        }
  
        let nextEthMonth = currentEth[1] + paymentIntervalInMonths;
        let nextEthYear = currentEth[0];
        while (nextEthMonth > 12) {
            nextEthMonth -= 12;
            nextEthYear += 1;
        }
        const nextEthDate: [number, number, number] = [nextEthYear, nextEthMonth, currentEth[2] || 1];
        const nextPaymentDateGregorian = new Date(toGregorian(nextEthDate).join('-'));
  
        let paid = 0;
        if (payableAmount > 0) {
            paid = Math.min(payableAmount, intervalAmount);
            payableAmount -= paid;
        }
  
        if (!isBefore(nextPaymentDateGregorian, leaseEndGregorian)) {
            let ethMonthsRemaining = (ethEnd[0] - currentEth[0]) * 12 + (ethEnd[1] - currentEth[1]);
            if (ethEnd[2] > currentEth[2]) ethMonthsRemaining += 1; // Fix for missing last month
            if (ethEnd[1] === 13) ethMonthsRemaining -= 1;
  
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