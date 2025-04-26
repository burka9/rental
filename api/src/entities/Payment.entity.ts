import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Index } from "typeorm";
import { Lease } from "./Lease.entity";
import { Bank } from "./Bank.entity";

export enum PaymentMethod {
    BANK_TRANSFER = "BANK_TRANSFER"
}

@Entity("payments")
@Index('unique_bank_reference', ['bankId', 'referenceNumber'], { unique: true })
export class Payment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    leaseId: number;

    @Column("decimal")
    paidAmount: number;

    @Column()
    paymentDate: Date;

    @Column({
        type: "enum",
        enum: PaymentMethod,
        default: PaymentMethod.BANK_TRANSFER
    })
    paymentMethod: PaymentMethod;

    @Column()
    bankId: number;

    @Column()
    referenceNumber: string;

    @Column({ nullable: true })
    notes: string;

    @Column({ default: false })
    isVerified: boolean;

    @Column({ nullable: true })
    verifiedAt: Date;

    @Column({ nullable: true })
    invoiceNumber: string;

    // New file columns
    @Column({ nullable: true })
    bankSlipPath: string  // File uploaded when making payment

    @Column({ nullable: true })
    invoicePath: string   // File generated/uploaded when payment is verified

    @ManyToOne(() => Lease, lease => lease.payments)
    lease: Lease;

    @ManyToOne(() => Bank, bank => bank.payments)
    bank: Bank;
} 