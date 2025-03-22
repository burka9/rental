import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, UpdateDateColumn, CreateDateColumn } from "typeorm";
import { Tenant } from "./Tenant.entity";

export enum NotificationStatus {
	PENDING = "PENDING",
	SENT = "SENT",
	FAILED = "FAILED"
}

@Entity()
export class Notification {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    tenantId: number;

    @Column()
    phoneNumber: string;

    @Column()
    message: string;

		@Column({
			type: "enum",
			enum: NotificationStatus,
			default: NotificationStatus.PENDING
		})
		status: NotificationStatus;
		
		@CreateDateColumn()
		createdAt: Date;

		@UpdateDateColumn()
		updatedAt: Date;

		@ManyToOne(() => Tenant, tenant => tenant.notifications, { onDelete: "CASCADE" })
		@JoinColumn({ name: "tenantId" })
		tenant: Tenant;
}
