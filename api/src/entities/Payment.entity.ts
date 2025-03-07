import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Lease } from "./Lease.entity";
import { Bank } from "./Bank.entity";

@Entity("payments")
export class Payment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    leaseId: number;

    @Column()
    scheduleId: number;

    @Column("decimal")
    paidAmount: number;

    @Column()
    paymentDate: Date;

    @Column({
        type: "enum",
        enum: ["BANK_TRANSFER"]
    })
    paymentMethod: "BANK_TRANSFER";

    @Column()
    bankId: number;

    @Column()
    notes: string;

    @Column()
    verified: boolean;

    @Column()
    verificationDate: Date;

    @ManyToOne(() => Lease, lease => lease.payments)
    lease: Lease;

    @ManyToOne(() => Bank, bank => bank.payments)
    bank: Bank;
} 