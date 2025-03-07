import { Router } from "express"
import { createRoom, deleteRoom, getRoom, updateRoom } from "../controller/room.controller"
import { Room } from "../entities/Room.entity"
import { getPartitionByRoomId } from "../controller/partition.controller"
export default function(): Router {
	const router = Router()

	router.get("/", async (req, res) => {
		const rooms = await getRoom()

		res.json({
			success: true,
			message: "Rooms fetched successfully",
			data: rooms
		})
	})

	router.get("/:id", async (req, res) => {
		const room = await getRoom(Number(req.params.id))

		res.json({
			success: true,
			message: "Room fetched successfully",
			data: room
		})
	})

	router.get("/:id/partitions", async (req, res) => {
		const partitions = await getPartitionByRoomId(Number(req.params.id))

		res.json({
			success: true,
			message: "Partitions fetched successfully",
			data: partitions
		})
	})

	router.post("/", async (req, res) => {
		const body = req.body as Partial<Room>

		const newRoom = await createRoom(body)

		res.json({
			success: true,
			message: "Room created successfully",
			data: newRoom
		})
	})

	router.put("/:id", async (req, res) => {
		const body = req.body as Partial<Room>

		const updatedRoom = await updateRoom(Number(req.params.id), body)

		res.json({
			success: true,
			message: "Room updated successfully",
			data: updatedRoom
		})
	})

	router.delete("/:id", async (req, res) => {
		const deletedRoom = await deleteRoom(Number(req.params.id))

		res.json({
			success: true,
			message: "Room deleted successfully",
			data: deletedRoom
		})
	})

	return router
}