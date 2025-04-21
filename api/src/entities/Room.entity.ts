import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, Unique } from "typeorm";
import { Building } from "./Building.entity"; // Assuming you have a Building entity

@Entity("rooms")
@Unique(["name", "buildingId"]) // Composite unique constraint on name and buildingId
export class Room {
    @PrimaryGeneratedColumn()
    id: number;

    @Column() // Remove unique: true to avoid global uniqueness on name
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