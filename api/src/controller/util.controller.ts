import { readFileSync } from "fs"
import { Database } from "../db"
import { Bank } from "../entities/Bank.entity"
import { Building } from "../entities/Building.entity"
import { Room } from "../entities/Room.entity"
import { Tenant } from "../entities/Tenant.entity"
import { User } from "../entities/User.entity"
import { UserFilter } from "../routes/auth.routes"
import { LeaseRepository } from "./lease.controller"
import { resolve } from "path"

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



export async function changeDate(): Promise<any> {
	const leases = await LeaseRepository
		.createQueryBuilder("lease")
		.leftJoinAndSelect("lease.tenant", "tenant")
		.getMany()


	const filenames = ['Block 1 Normal tenants', 'Block 2 Normal Tenants', 'Block 3 Normal Tenants']
	let _data: { [key: string]: any } = {}

	for (const file of filenames) {
		const d = readFileSync(resolve(__dirname, `../../data/json/${file}.json`)).toString()
		_data = {
			..._data,
			...JSON.parse(d),
		}
	}

	const data: { [key: string]: any } = {}
	
	let idx = 0

	// fix incorrect shareholders, and mark their contracts active if any?
	for await (const item of Object.values(_data)) {
		console.log(item['start date'])
		
		if (item['block number'] == "3") {
			const lease = await LeaseRepository.query(`
				SELECT * FROM leases l
					LEFT JOIN tenants t ON l.tenantId = t.id
					LEFT JOIN rooms r ON FIND_IN_SET(r.id, l.roomIds)
				WhERE r.buildingId = 3 AND t.name = '${item['tenant name']}';
			`)

			if (!lease) continue

			const el_item: any = {}

			for (const [key, value] of Object.entries(lease[0]) as any) {
				el_item[key] = value
			}

			// tenant: update shareholder status
			const tenant = await TenantRepository.query(`
				UPDATE tenants
					SET isShareholder = 0
				WHERE id = ${el_item['tenantId']}
			`)

			// lease: mark as active
			const _lease = await LeaseRepository.query(`
				UPDATE leases
					SET active = 1
				WHERE id = ${el_item['id']}
			`)

			// rooms: reclaim rooms
			for await (const id of el_item['roomIds'].split(',')) {
				const room = await RoomRepository.query(`
					UPDATE rooms
						SET occupied = 1
					WHERE id = ${id}
				`)
			}

			// paymentSchedule: generate payment schedules
			idx++
		}
	}

	return idx
}