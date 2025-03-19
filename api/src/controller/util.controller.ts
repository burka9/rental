import { Database } from "../db"
import { Bank } from "../entities/Bank.entity"
import { Building } from "../entities/Building.entity"
import { Partition } from "../entities/Partition.entity"
import { Room } from "../entities/Room.entity"
import { Tenant } from "../entities/Tenant.entity"
import { User } from "../entities/User.entity"

export const TenantRepository = Database.getRepository(Tenant)
export const BuildingRepository = Database.getRepository(Building)
export const RoomRepository = Database.getRepository(Room)
export const PartitionRepository = Database.getRepository(Partition)
export const BankRepository = Database.getRepository(Bank)
export const UserRepository = Database.getRepository(User)

export async function getOverview() {
	const tenants = await TenantRepository.count()
	const offices = await PartitionRepository.count()
	const vacantOffices = await PartitionRepository.countBy({ occupied: false })
	const rooms = await RoomRepository.count()
	const buildings = await BuildingRepository.count()
	const users = await UserRepository.count()
	const banks = await BankRepository.count()

	return {
		offices,
		vacantOffices,
		tenants,
		rooms,
		buildings,
		users,
		banks,
	}
}