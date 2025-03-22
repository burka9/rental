import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Lease } from "./Lease.entity";
import { Notification } from "./Notification.entity";

@Entity("tenants")
export class Tenant {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ nullable: true })
    phone: string;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    tinNumber: string;
    
    @Column()
    isShareholder: boolean;
    
    @OneToMany(() => Lease, lease => lease.tenant)
    leases: Lease[];

    @OneToMany(() => Notification, notification => notification.tenant)
    notifications: Notification[];
} 