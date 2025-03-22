import { addMonths, isAfter, isBefore } from "date-fns"
import { Database } from "../db"
import { Lease } from "../entities/Lease.entity"
import { PaymentSchedule } from "../entities/PaymentSchedule.entity"

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
    const paymentIntervalInMonths = Number(interval)
	const schedule: Partial<PaymentSchedule>[] = [];

	const leaseEndDate = new Date(endDate);

	// Calculate total amount per interval
	const totalAmountPerMonth = Object.values(paymentAmountPerMonth).reduce((sum, amount) => sum + amount, 0);
	const intervalAmount = totalAmountPerMonth * paymentIntervalInMonths;

	let paymentDate = new Date(startDate); // Payment is made at the start of each period
	const leaseId = lease.id;
    let payableAmount = initialPayment?.amount ?? 0;

    console.log('payment date -- \t lease end date -- total amount per month -- interval amount -- payment interval in months')
    console.log(paymentDate.toDateString(), '\t', leaseEndDate.toDateString(), '\t', totalAmountPerMonth, '\t\t\t', intervalAmount, '\t\t\t', paymentIntervalInMonths)
    console.log('--------------------------------')

	while (!isAfter(paymentDate, leaseEndDate)) {
        console.log('payment date:', paymentDate.toDateString())
        // Check if this is the final payment and needs proration
        // const nextPaymentDate = new Date(paymentDate);
        // nextPaymentDate.setMonth(nextPaymentDate.getMonth() + paymentIntervalInMonths);
        const nextPaymentDate = addMonths(paymentDate, paymentIntervalInMonths)

        console.log('next payment date:', nextPaymentDate.toDateString())
        console.log('amount:', intervalAmount)
        console.log('payable amount:', payableAmount)

        let paid = 0

        if (payableAmount > 0) {
            if (payableAmount >= intervalAmount) {
                paid = intervalAmount
                payableAmount -= intervalAmount
            } else {
                paid = payableAmount
                payableAmount = 0
            }
        }
        
        if (!isBefore(nextPaymentDate, leaseEndDate)) {
            const remainingMonths = (leaseEndDate.getFullYear() - paymentDate.getFullYear()) * 12 
                                                        + (leaseEndDate.getMonth() - paymentDate.getMonth());

            const finalAmount = totalAmountPerMonth * remainingMonths;
            schedule.push({
                dueDate: paymentDate,
                payableAmount: finalAmount,
                leaseId,
                lease,
                paidAmount: paid,
                paymentDate: paid !== 0 ? new Date(paymentDate) : undefined
            });
            break;
        }

        
        schedule.push({
            dueDate: new Date(paymentDate),
            payableAmount: intervalAmount,
            leaseId,
            lease,
            paidAmount: paid,
            paymentDate: paid !== 0 ? new Date(paymentDate) : undefined
        });

        // Move to the next payment period
        paymentDate = nextPaymentDate;
        console.log('\t-----')
	}

    console.log(schedule.length)

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