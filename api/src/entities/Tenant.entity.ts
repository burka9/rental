import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Lease } from "./Lease.entity";

@Entity("tenants")
export class Tenant {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ unique: true })
    phone: string;

    @Column()
    address: string;

    @Column()
    tinNumber: string;
    
    @OneToMany(() => Lease, lease => lease.tenant)
    leases: Lease[];
} 