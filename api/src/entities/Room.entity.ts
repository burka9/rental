import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from "typeorm";
import { Building } from "./Building.entity";
import { Partition } from "./Partition.entity";

@Entity("rooms")
export class Room {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    number: string;

    @Column()
    floorNumber: number;

    @Column()
    buildingId: number;

    @ManyToOne(() => Building, building => building.rooms)
    building: Building;

    @OneToMany(() => Partition, partition => partition.room, {
        cascade: true,
        onDelete: 'CASCADE'
    })
    partitions: Partition[];
} 