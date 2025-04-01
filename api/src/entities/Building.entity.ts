import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { Room } from "./Room.entity";

@Entity("buildings")
export class Building {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column({ nullable: true })
    address: string;

    @Column()
    noOfFloors: number;

    @Column()
    noOfBasements: number;

    @Column("json")
    floors: { order: number, name: string }[];

    @OneToMany(() => Room, room => room.building)
    rooms: Room[];
} 