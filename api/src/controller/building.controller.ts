import { Database } from "../db";
import { Building } from "../entities/Building.entity";
import { TenantRepository } from "../controller/tenant.controller";
import { In } from "typeorm";
import { UserFilter } from "../routes/auth.routes";

export const BuildingRepository = Database.getRepository(Building)

export async function getBuilding({ buildingId }: UserFilter, id?: number) {
  if (!id) {
    // Fetch all buildings with their rooms
    const buildings = await BuildingRepository.find({
      where: { id: buildingId },
      relations: {
        rooms: true,
      },
    });

    // Calculate tenant count for each building
    const buildingsWithTenantCount = await Promise.all(
      buildings.map(async (building) => {
        const roomIds = building.rooms.map((room) => room.id);

        const tenantCount = await TenantRepository.count({
          relations: ["leases"],
          where: {
            leases: {
              roomIds: In(roomIds), // Match tenants whose leases include any of this building's room IDs
            },
          },
        });

        return {
          ...building,
          tenantCount,
        };
      })
    );

    return buildingsWithTenantCount;
  } else {
    // Fetch a single building with its rooms
    const building = await BuildingRepository.findOne({
      where: { id },
      relations: {
        rooms: true,
      },
    });

    if (!building || building.id !== id) {
      throw new Error(`Building with id ${id} not found`);
    }

    // Get room IDs for this building
    const roomIds = building.rooms.map((room) => room.id);

    // Count tenants linked to this building's rooms
    const tenantCount = await TenantRepository.count({
      relations: ["leases"],
      where: {
        leases: {
          roomIds: In(roomIds), // Match tenants whose leases include any of this building's room IDs
        },
      },
    });

    return {
      ...building,
      tenantCount,
    };
  }
}

export async function createBuilding(building: Partial<Building>) {
	const newBuilding = await BuildingRepository.create(building)

	newBuilding.floors = []
	
	for (let i = (building.noOfBasements ?? 0); i > 0; i--) {
		newBuilding.floors.push({ order: newBuilding.floors.length, name: `BS${i}` })
	}

	newBuilding.floors.push({ order: newBuilding.floors.length, name: `GF` })
	
	// floors
	for (let i = 1; i <= (building.noOfFloors ?? 0); i++) {
		newBuilding.floors.push({ order: newBuilding.floors.length, name: `F${i}` })
	}

	await BuildingRepository.save(newBuilding)
	
	return newBuilding
}

export async function updateBuilding(id: number, buildingData: Partial<Building>) {
  // First get the existing building with its relations
  const existingBuilding = await BuildingRepository.findOne({
    where: { id },
    relations: ['rooms']
  });

  if (!existingBuilding) {
    throw new Error('Building not found');
  }

  // Update only the allowed fields
  const updatedBuilding = BuildingRepository.merge(existingBuilding, {
    name: buildingData.name,
    address: buildingData.address,
    noOfFloors: buildingData.noOfFloors,
    noOfBasements: buildingData.noOfBasements,
    // Preserve the existing rooms relationship
    rooms: existingBuilding.rooms
  });

  // Save the updated building
  await BuildingRepository.save(updatedBuilding);

  // Return the updated building with its relations
  return BuildingRepository.findOne({
    where: { id },
    relations: ['rooms']
  });
}

export async function deleteBuilding(id: number) {
	const deletedBuilding = await BuildingRepository.delete(id)

	return deletedBuilding
}

