import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

export enum ROLES {
    ADMIN = "ADMIN",
    BUILDING_ADMIN = "BUILDING_ADMIN",
    TENANT = "TENANT",
    FINANCE_ADMIN = "FINANCE_ADMIN"
}

@Entity("users")
export class User {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    phone: string;

    @Column({
        type: "enum",
        enum: ROLES
    })
    role: ROLES;
} 