import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Lease } from "./Lease.entity";

@Entity("payment_schedules")
export class PaymentSchedule {
    @PrimaryGeneratedColumn()
    id: number;

    @Column("decimal")
    payableAmount: number;

    @Column("decimal")
    paidAmount: number;

    @Column()
    dueDate: Date;

    @Column()
    leaseId: number;

    @Column({ nullable: true })
    paymentDate?: Date;

    @ManyToOne(() => Lease, lease => lease.paymentSchedule)
    lease: Lease;
} 