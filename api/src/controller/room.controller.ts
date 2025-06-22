import { In } from "typeorm/find-options/operator/In"
import { Database } from "../db"
import { Room } from "../entities/Room.entity"
import { UserFilter } from "../routes/auth.routes"

export const RoomRepository = Database.getRepository(Room)

export async function getRooms(filter: UserFilter, ids?: number[]) {
	const rooms = await RoomRepository.find({
		where: {
			...filter,
			id: ids ? In(ids) : undefined
		}
	})
	return rooms
}

export async function getRoom(id?: number) {
	const room = id
		? await RoomRepository.findOne({ 
			where: { id },
		}) 
		: await RoomRepository.find({
		})

	return room
}

export async function createRoom(room: Partial<Room>) {
	if (!room.buildingId) {
		throw new Error("buildingId is required when creating a room")
	}

	// Start a transaction to ensure both room and partition are created
	return await Database.transaction(async transactionalEntityManager => {
		// Create and save the room first
		const newRoom = RoomRepository.create(room)
		const savedRoom = await transactionalEntityManager.save(newRoom)

		// Return room
		return await transactionalEntityManager.findOne(Room, {
			where: { id: savedRoom.id },
		})
	})
}

export async function updateRoom(id: number, room: Partial<Room>) {
	const updatedRoom = await RoomRepository.update(id, room)
	return updatedRoom
}

export async function deleteRoom(id: number) {
	// Partitions will be automatically deleted due to cascade
	const deletedRoom = await RoomRepository.delete(id)
	return deletedRoom
}