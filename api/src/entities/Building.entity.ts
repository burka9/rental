import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Room } from "./Room.entity";

@Entity("buildings")
export class Building {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    address: string;

    @Column()
    noOfFloors: number;

    @OneToMany(() => Room, room => room.building)
    rooms: Room[];
} 