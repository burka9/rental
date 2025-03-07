import { Partition } from "../entities/Partition.entity"
import { Database } from "../db"
import { In } from "typeorm"

export const PartitionRepository = Database.getRepository(Partition)

export async function getPartition(id?: number) {
	const partition = id ? await PartitionRepository.findOne({
		where: { id }
	}) : await PartitionRepository.find()

	return partition
}

export async function getPartitions(ids?: number[]) {
	const partitions = ids ? await PartitionRepository.find({
		where: { id: In(ids) }
	}) : await PartitionRepository.find()

	return partitions
}

export async function getPartitionByRoomId(roomId: number) {
	const partition = await PartitionRepository.findOne({
		where: { roomId }
	})

	return partition
}

export async function createPartition(partition: Partial<Partition>) {
	const newPartition = await PartitionRepository.create(partition)

	await PartitionRepository.save(newPartition)

	return newPartition
}

export async function updatePartition(id: number, partition: Partial<Partition>) {
	const updatedPartition = await PartitionRepository.update(id, partition)

	return updatedPartition
}

export async function deletePartition(id: number) {
	const deletedPartition = await PartitionRepository.delete(id)

	return deletedPartition
}

