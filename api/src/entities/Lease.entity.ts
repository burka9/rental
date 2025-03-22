import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { Tenant } from "./Tenant.entity";
import { PaymentSchedule } from "./PaymentSchedule.entity";
import { Payment } from "./Payment.entity";

export enum PaymentType {
    PREPAID = "PREPAID",
    POSTPAID = "POSTPAID",
}

export enum LateFeeType {
    FIXED = "FIXED",
    PERCENTAGE = "PERCENTAGE"
}

@Entity("leases")
export class Lease {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    startDate: Date;

    @Column({ nullable: true })
    endDate: Date;

    @Column({ nullable: true })
    tenantId: number;

    @Column("simple-array", { nullable: true })
    roomIds: number[];

    @Column({
        type: "enum",
        enum: PaymentType,
        default: PaymentType.PREPAID,
        nullable: true
    })
    paymentType: PaymentType;

    @Column("json", { nullable: true })
    paymentAmountPerMonth: {
        base: number;
        utility: number;
        [key: string]: number;
    };

    @Column("decimal", { nullable: true })
    deposit: number;

    @Column({ nullable: true })
    paymentIntervalInMonths: number;

    @Column("json", { nullable: true })
    initialPayment: {
        amount: number;
        paymentDate: Date;
    };

    @Column("decimal", { nullable: true })
    lateFee: number;

    @Column({
        type: "enum",
        enum: LateFeeType,
        default: LateFeeType.PERCENTAGE,
        nullable: true
    })
    lateFeeType: LateFeeType;

    @Column({ nullable: true })
    lateFeeGracePeriodInDays: number;

    @Column("json", { nullable: true })
    files: {
        filename: string
        path: string
    }[];

    @Column({ nullable: true })
    active: boolean;

    @ManyToOne(() => Tenant, tenant => tenant.leases)
    @JoinColumn({ name: "tenantId" })
    tenant: Tenant;

    @OneToMany(() => PaymentSchedule, schedule => schedule.lease)
    paymentSchedule: PaymentSchedule[];

    @OneToMany(() => Payment, payment => payment.lease)
    payments: Payment[];
} 