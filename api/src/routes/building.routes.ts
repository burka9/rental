import { Router } from "express";
import { createBuilding, deleteBuilding, getBuilding, updateBuilding } from "../controller/building.controller";
import { Building } from "../entities/Building.entity";
import { verifyToken, verifyUser } from "./auth.routes";

export default function(): Router {
	const router = Router()

	router.get("/", verifyToken, verifyUser, async (req, res) => {
		res.json({
			success: true,
			message: "Building fetched successfully",
			data: await getBuilding(res.locals.filter)
		})
	})

	router.get("/:id", verifyToken, verifyUser, async (req, res) => {
		res.json({
			success: true,
			message: "Building fetched successfully",
			data: await getBuilding(res.locals.filter, Number(req.params.id))
		})
	})

	router.post("/", verifyToken, verifyUser, async (req, res) => {
		const body = req.body as Partial<Building>
		
		const newBuilding = await createBuilding({
			name: body.name,
			address: body.address,
			noOfFloors: body.noOfFloors,
			noOfBasements: body.noOfBasements,
		})

		res.json({
			success: true,
			message: "Building created successfully",
			data: newBuilding
		})
	})

	router.put("/:id", verifyToken, verifyUser, async (req, res) => {
		const body = req.body as Partial<Building>
		
		const updatedBuilding = await updateBuilding(Number(req.params.id), body)

		res.json({
			success: true,
			message: "Building updated successfully",
			data: updatedBuilding
		})
	})

	router.delete("/:id", verifyToken, verifyUser, async (req, res) => {
		const deletedBuilding = await deleteBuilding(Number(req.params.id))

		res.json({
			success: true,
			message: "Building deleted successfully",
			data: deletedBuilding
		})
	})

	return router
}