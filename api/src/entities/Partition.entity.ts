import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { Room } from "./Room.entity";

@Entity("partitions")
export class Partition {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    roomId: number;

    @Column()
    buildingId: number;

    @Column()
    occupied: boolean;

    @Column()
    sizeInSquareMeters: number;

    @ManyToOne(() => Room, room => room.partitions)
    room: Room;
} 