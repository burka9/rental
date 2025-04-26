import { Lease } from '../entities/Lease.entity';
import { Payment } from '../entities/Payment.entity';
import { Tenant } from '../entities/Tenant.entity';
import { LeaseRepository, PaymentScheduleRepository } from './lease.controller';
import { PaymentRepository } from './payment.controller';
import { TenantRepository } from './tenant.controller';
import { RoomRepository } from './room.controller';

export type BasicReport = {
    totalRooms: number;
    vacantRooms: number;
    totalTenants: number;
    overduePayments: {
        totalTenants: number;
        totalAmount: number;
    };
    upcomingPayment: {
        tenantId: string;
        leaseId: string;
        tenantName: string;
        dueDate: Date;
        paymentAmount: number;
    }[];
}

export async function getBasicReports(): Promise<BasicReport> {
    const currentDate = new Date();

    // Total rooms
    const totalRooms = await RoomRepository.count();

    // Vacant rooms
    const vacantRooms = await RoomRepository.count({ where: { occupied: false } });

    // Total tenants with active leases
    const totalTenants = await TenantRepository.count({
        where: { leases: { active: true } },
        relations: ['leases'],
    });

    // Overdue payments: unpaid/partially paid schedules with dueDate < current date
    const overduePayments = await PaymentScheduleRepository.createQueryBuilder("schedule")
        .leftJoinAndSelect("schedule.lease", "lease")
        .leftJoinAndSelect("lease.tenant", "tenant")
        .where("schedule.dueDate < :currentDate", { currentDate })
        .andWhere("schedule.paidAmount < schedule.payableAmount")
        .getMany();

    // Upcoming payments: unpaid/partially paid schedules with dueDate > current date
    const upcomingPayments = await PaymentScheduleRepository.createQueryBuilder("schedule")
        .leftJoinAndSelect("schedule.lease", "lease")
        .leftJoinAndSelect("lease.tenant", "tenant")
        .where("schedule.dueDate > :currentDate", { currentDate })
        .andWhere("schedule.paidAmount < schedule.payableAmount")
        .orderBy("schedule.dueDate", "ASC")
        .getMany();

    return {
        totalRooms,
        vacantRooms,
        totalTenants,
        overduePayments: {
            totalTenants: new Set(overduePayments.map(payment => payment.lease?.tenant?.name)).size,
            totalAmount: overduePayments.reduce((total, payment) => {
                const remaining = Number(payment.payableAmount) - (Number(payment.paidAmount) || 0);
                return total + remaining;
            }, 0),
        },
        upcomingPayment: upcomingPayments.map(payment => ({
            leaseId: payment.lease?.id?.toString() ?? "0",
            tenantId: payment.lease?.tenant?.id?.toString() ?? "0",
            tenantName: payment.lease?.tenant?.name ?? "Unknown",
            dueDate: payment.dueDate,
            paymentAmount: Number(payment.payableAmount) - (Number(payment.paidAmount) || 0),
        })),
    };
}