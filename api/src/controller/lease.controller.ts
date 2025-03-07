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
    delete lease.partitionIds

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
    const schedules: Partial<PaymentSchedule>[] = []
    const startDate = new Date(lease.startDate)
    const endDate = new Date(lease.endDate)
    
    // Calculate base amount from paymentAmountPerMonth
    const totalMonthlyAmount = Object.values(lease.paymentAmountPerMonth)
        .reduce((sum, amount) => sum + amount, 0)

    let currentDate = startDate
    while (currentDate <= endDate) {
        schedules.push({
            leaseId: lease.id,
            amount: totalMonthlyAmount,
            dueDate: new Date(currentDate),
        })

        // Add months based on payment interval
        currentDate.setMonth(currentDate.getMonth() + (lease.paymentIntervalInMonths || 1))
    }

    return schedules
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