import { Database } from "../db";
import { Building } from "../entities/Building.entity";

export const BuildingRepository = Database.getRepository(Building)

export async function getBuilding(id?: number) {
	const building = id 
		? await BuildingRepository.findOne({ 
			where: { id },
			relations: {
				rooms: true
			}
		}) 
		: await BuildingRepository.find({
			relations: {
				rooms: true
			}
		})

	return building
}

export async function createBuilding(building: Partial<Building>) {
	const newBuilding = await BuildingRepository.create(building)

	await BuildingRepository.save(newBuilding)
	
	return newBuilding
}

export async function updateBuilding(id: number, building: Partial<Building>) {
	const updatedBuilding = await BuildingRepository.update(id, building)

	return updatedBuilding
}

export async function deleteBuilding(id: number) {
	const deletedBuilding = await BuildingRepository.delete(id)

	return deletedBuilding
}

