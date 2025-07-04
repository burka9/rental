import { Router } from "express"
import { createRoom, deleteRoom, getRoom, getRooms, updateRoom } from "../controller/room.controller"
import { Room } from "../entities/Room.entity"
import { verifyToken, verifyUser } from "./auth.routes"

export default function(): Router {
	const router = Router()

	router.get("/", verifyToken, verifyUser, async (req, res) => {
		const ids = req.query.ids ? (req.query.ids as string).split(",").map(Number) : undefined

		const filter = res.locals.filter

		const rooms = await getRooms(filter, ids)
		
		res.json({
			success: true,
			message: "Rooms fetched successfully",
			data: rooms
		})
	})

	router.get("/:id", verifyToken, verifyUser, async (req, res) => {
		const room = await getRoom(Number(req.params.id))

		res.json({
			success: true,
			message: "Room fetched successfully",
			data: room
		})
	})

	router.post("/", verifyToken, verifyUser, async (req, res) => {
		const body = req.body as Partial<Room>

		const newRoom = await createRoom(body)

		res.json({
			success: true,
			message: "Room created successfully",
			data: newRoom
		})
	})

	router.put("/:id", verifyToken, verifyUser, async (req, res) => {
		const body = req.body as Partial<Room>

		const updatedRoom = await updateRoom(Number(req.params.id), body)

		res.json({
			success: true,
			message: "Room updated successfully",
			data: updatedRoom
		})
	})

	router.delete("/:id", verifyToken, verifyUser, async (req, res) => {
		const deletedRoom = await deleteRoom(Number(req.params.id))

		res.json({
			success: true,
			message: "Room deleted successfully",
			data: deletedRoom
		})
	})

	return router
}