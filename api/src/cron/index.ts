import { LessThan, In } from "typeorm"
import { LeaseRepository } from "../controller/lease.controller"
import { RoomRepository } from "../controller/room.controller"

// check for expired leases and terminate them
export const checkExpiredLeases = async () => {
  const leases = await LeaseRepository.find({ where: { endDate: LessThan(new Date()) } })

	// mark leases as expired
  for (const lease of leases) {
    await LeaseRepository.update(lease.id, { active: false })
  }

	// update room status
	for (const lease of leases) {
		const rooms = await RoomRepository.find({ where: { id: In(lease.roomIds) } })
		if (rooms) {
			await RoomRepository.update(rooms.map((room) => room.id), { occupied: false })
		}
	}
}
