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

    @Column()
    startDate: Date;

    @Column()
    endDate: Date;

    @Column()
    tenantId: number;

    @Column("simple-array")
    partitionIds: number[];

    @Column({
        type: "enum",
        enum: PaymentType,
        default: PaymentType.PREPAID
    })
    paymentType: PaymentType;

    @Column("json")
    paymentAmountPerMonth: {
        base: number;
        utility: number;
        [key: string]: number;
    };

    @Column("decimal")
    deposit: number;

    @Column()
    paymentIntervalInMonths: number;

    @Column("json", { nullable: true })
    initialPayment?: {
        amount: number;
        paymentDate: Date;
    };

    @Column("decimal")
    lateFee: number;

    @Column({
        type: "enum",
        enum: LateFeeType,
        default: LateFeeType.PERCENTAGE
    })
    lateFeeType: LateFeeType;

    @Column()
    lateFeeGracePeriodInDays: number;

    @Column("json", { nullable: true })
    files: {
        filename: string
        path: string
    }[];

    @Column()
    active: boolean;

    @ManyToOne(() => Tenant, tenant => tenant.leases)
    @JoinColumn({ name: "tenantId" })
    tenant: Tenant;

    @OneToMany(() => PaymentSchedule, schedule => schedule.lease)
    paymentSchedule: PaymentSchedule[];

    @OneToMany(() => Payment, payment => payment.lease)
    payments: Payment[];
} 