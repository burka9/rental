import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Activity {
	@PrimaryGeneratedColumn()
	id: number;

	@Column()
	name: string;

	@Column()
	userId: number;

	@Column()
	entityType: string;

	@Column()
	entityId: number;

	@Column()
	action: "CREATE" | "READ" | "UPDATE" | "DELETE";

	@Column()
	timestamp: Date;

	@Column()
	text: string;

	@Column()
	description: string;

	@Column({ type: 'json', nullable: true })
	details: { [key: string]: any };
}
