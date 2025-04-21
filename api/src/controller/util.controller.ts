import { Database } from "../db"
import { Bank } from "../entities/Bank.entity"
import { Building } from "../entities/Building.entity"
import { Room } from "../entities/Room.entity"
import { Tenant } from "../entities/Tenant.entity"
import { User } from "../entities/User.entity"

export const TenantRepository = Database.getRepository(Tenant)
export const BuildingRepository = Database.getRepository(Building)
export const RoomRepository = Database.getRepository(Room)
export const BankRepository = Database.getRepository(Bank)
export const UserRepository = Database.getRepository(User)

export async function getOverview() {
	const tenants = await TenantRepository.count()
	const rooms = await RoomRepository.count()
	const vacantRooms = await RoomRepository.countBy({ occupied: false })
	const buildings = await BuildingRepository.count()
	const users = await UserRepository.count()
	const banks = await BankRepository.count()
	const leases = await TenantRepository.countBy({ leases: { active: true } })

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
