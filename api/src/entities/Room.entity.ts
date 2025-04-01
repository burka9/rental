import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Building } from "./Building.entity";

@Entity("rooms")
export class Room {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ unique: true })
    name: string;

    @Column()
    floorNumber: string;

    @Column()
    buildingId: number;

    @ManyToOne(() => Building, building => building.rooms)
    building: Building;

    @Column()
    occupied: boolean;

    @Column({ nullable: true })
    purpose: string;

    @Column("float", { nullable: true })
    sizeInSquareMeters: number;
} 