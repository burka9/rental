import { Lease } from '../entities/Lease.entity';
import { Payment } from '../entities/Payment.entity';
import { Tenant } from '../entities/Tenant.entity';
import { LeaseRepository, PaymentScheduleRepository } from './lease.controller';
import { PaymentRepository } from './payment.controller';
import { TenantRepository } from './tenant.controller';
import { RoomRepository } from './room.controller';
import { LessThan, MoreThan } from 'typeorm';

export type BasicReport = {
	totalRooms: number
	vacantRooms: number
	totalTenants: number
	overduePayments: {
		totalTenants: number
		totalAmount: number
	}
	upcomingPayment: {
		tenantId: number
		leaseId: number
		tenantName: string
		dueDate: Date
		paymentAmount: number
	}[]
}

export async function getBasicReports(): Promise<BasicReport> {
	const totalRooms = await RoomRepository.count()
	const vacantRooms = await RoomRepository.count({ where: { occupied: false } })

	const overduePayments = await PaymentScheduleRepository.find({
		where: {
			dueDate: LessThan(new Date())
		},
		relations: ['lease', 'lease.tenant']
	})

	const upcomingPayments = await PaymentScheduleRepository.find({
		where: {
			dueDate: MoreThan(new Date())
		},
		relations: ['lease', 'lease.tenant']
	})

	const totalTenants = await TenantRepository.count({
		where: {
			leases: {
				active: true
			}
		}
	})

	return {
		totalRooms,
		vacantRooms,
		totalTenants,
		overduePayments: {
			totalTenants: new Set(overduePayments.map(payment => payment.lease.tenant.name)).size,
			totalAmount: overduePayments.reduce((total, payment) => Number(total) + Number(payment.payableAmount), 0)
		},
		upcomingPayment: upcomingPayments.map(payment => ({
			leaseId: payment.lease.id,
			tenantId: payment.lease.tenant.id,
			tenantName: payment.lease.tenant.name,
			dueDate: payment.dueDate,
			paymentAmount: Number(payment.payableAmount)
		}))
	}
}