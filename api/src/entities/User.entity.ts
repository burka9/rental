import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Building } from "./Building.entity";

export enum ROLES {
  SUPERADMIN = "SUPERADMIN",
  ADMIN = "ADMIN",
  BUILDING_ADMIN = "BUILDING_ADMIN",
  TENANT = "TENANT",
  BOARD_MEMBER = "BOARD_MEMBER",
  FINANCE_ADMIN = "FINANCE_ADMIN",
  EMPTY = "EMPTY",
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  name: string;

  @Column({ unique: true, nullable: false })
  phone: string;

  @Column({
    type: 'enum',
    enum: ROLES,
    default: ROLES.EMPTY, // Optional: default to EMPTY for new users
  })
  role: ROLES;

  @Column()
  password: string;

  @Column({ nullable: true })
  buildingId: number; // Links to a Building for BUILDING_ADMIN users

  @ManyToOne(() => Building, (building) => building.rooms, { nullable: true })
  building: Building; // Relationship to Building (optional)

  @Column({ nullable: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => Session, (session) => session.user)
  sessions: Session[];
}

@Entity()
export class Session {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @Column()
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  token: string;

  @Column()
  isActive: boolean;

  @ManyToOne(() => User, (user) => user.sessions)
  user: User;
}