import { Router } from "express";
import { createBuilding, deleteBuilding, getBuilding, updateBuilding } from "../controller/building.controller";
import { Building } from "../entities/Building.entity";

export default function(): Router {
	const router = Router()

	router.get("/", async (req, res) => {
		res.json({
			success: true,
			message: "Building fetched successfully",
			data: await getBuilding()
		})
	})

	router.get("/:id", async (req, res) => {
		res.json({
			success: true,
			message: "Building fetched successfully",
			data: await getBuilding(Number(req.params.id))
		})
	})

	router.post("/", async (req, res) => {
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

	router.put("/:id", async (req, res) => {
		const body = req.body as Partial<Building>
		
		const updatedBuilding = await updateBuilding(Number(req.params.id), body)

		res.json({
			success: true,
			message: "Building updated successfully",
			data: updatedBuilding
		})
	})

	router.delete("/:id", async (req, res) => {
		const deletedBuilding = await deleteBuilding(Number(req.params.id))

		res.json({
			success: true,
			message: "Building deleted successfully",
			data: deletedBuilding
		})
	})

	return router
}