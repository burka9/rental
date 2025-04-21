import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Payment } from "./Payment.entity";

@Entity("banks")
export class Bank {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    branch: string;

    @Column()
    accountNumber: string;

    @OneToMany(() => Payment, payment => payment.bank)
    payments: Payment[];
} 