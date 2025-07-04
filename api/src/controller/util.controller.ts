import { Database } from "../db"
import { Bank } from "../entities/Bank.entity"
import { Building } from "../entities/Building.entity"
import { Room } from "../entities/Room.entity"
import { Tenant } from "../entities/Tenant.entity"
import { User } from "../entities/User.entity"
import { UserFilter } from "../routes/auth.routes"

export const TenantRepository = Database.getRepository(Tenant)
export const BuildingRepository = Database.getRepository(Building)
export const RoomRepository = Database.getRepository(Room)
export const BankRepository = Database.getRepository(Bank)
export const UserRepository = Database.getRepository(User)

export async function getOverview({ buildingId }: UserFilter) {
	let tenants = 0
	
	if (buildingId) {
		tenants = await TenantRepository.createQueryBuilder("tenant")
			.leftJoinAndSelect("tenant.leases", "leases")
			.leftJoinAndSelect("rooms", "rooms", "FIND_IN_SET(rooms.id, leases.roomIds)")
			.andWhere("rooms.buildingId = :buildingId", {
				buildingId,
		})
		.andWhere("leases.active = :active", {
			active: true,
		})
		.getCount()
	} else {
		tenants = await TenantRepository.createQueryBuilder("tenant")
			.leftJoinAndSelect("tenant.leases", "leases")
			.leftJoinAndSelect("rooms", "rooms", "FIND_IN_SET(rooms.id, leases.roomIds)")
			.andWhere("leases.active = :active", {
				active: true,
			})
			.getCount()
	}
	const rooms = await RoomRepository.countBy({ buildingId })
	const vacantRooms = await RoomRepository.countBy({ occupied: false, buildingId })
	const buildings = await BuildingRepository.countBy({ id: buildingId })
	const users = await UserRepository.count()
	const banks = await BankRepository.count()
	const leases =await TenantRepository.createQueryBuilder("tenant")
		.leftJoinAndSelect("tenant.leases", "leases")
		.leftJoinAndSelect("rooms", "rooms", "FIND_IN_SET(rooms.id, leases.roomIds)")
		.andWhere("rooms.buildingId = :buildingId", {
			buildingId,
		})
		.andWhere("leases.active = :active", {
			active: true
		})
		.getCount()
		
	return {
		tenants,
		rooms,
		vacantRooms,
		buildings,
		users,
		banks,
		leases
	}
}
