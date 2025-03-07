import { Database } from "../db"
import { Room } from "../entities/Room.entity"
import { Partition } from "../entities/Partition.entity"

export const RoomRepository = Database.getRepository(Room)
export const PartitionRepository = Database.getRepository(Partition)

export async function getRoom(id?: number) {
	const relations = {
		partitions: true
	}
	
	const room = id
		? await RoomRepository.findOne({ 
			where: { id },
			relations 
		}) 
		: await RoomRepository.find({
			relations
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

		// Create initial partition
		const initialPartition = PartitionRepository.create({
			name: savedRoom.number,
			roomId: savedRoom.id,
			room: savedRoom,
			buildingId: savedRoom.buildingId,
			occupied: false,
			sizeInSquareMeters: 100
		})
		await transactionalEntityManager.save(initialPartition)

		// Return room with partition
		return await transactionalEntityManager.findOne(Room, {
			where: { id: savedRoom.id },
			relations: { partitions: true }
		})
	})
}

export async function updateRoom(id: number, room: Partial<Room>) {
	// Check if room has at least one partition before update
	const existingRoom = await RoomRepository.findOne({
		where: { id },
		relations: { partitions: true }
	})

	if (!existingRoom?.partitions?.length) {
		throw new Error("Room must have at least one partition")
	}

	const updatedRoom = await RoomRepository.update(id, room)
	return updatedRoom
}

export async function deleteRoom(id: number) {
	// Partitions will be automatically deleted due to cascade
	const deletedRoom = await RoomRepository.delete(id)
	return deletedRoom
}