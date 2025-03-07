import { Router } from "express"
import { createPartition, deletePartition, getPartition, updatePartition } from "../controller/partition.controller"
import { Partition } from "../entities/Partition.entity"

export default function(): Router {
	const router = Router()

	router.get("/", async (req, res) => {
		const partitions = await getPartition()
		res.json({
			success: true,
			message: "Partitions fetched successfully",
			data: partitions
		})
	})

	router.get("/:id", async (req, res) => {
		const partition = await getPartition(Number(req.params.id))
		res.json({
			success: true,
			message: "Partition fetched successfully",
			data: partition
		})
	})

	router.post("/", async (req, res) => {
		const partition = await createPartition(req.body as Partial<Partition>)
		res.json({
			success: true,
			message: "Partition created successfully",
			data: partition
		})
	})
	
	router.put("/:id", async (req, res) => {
		const partition = await updatePartition(Number(req.params.id), req.body as Partial<Partition>)
		res.json({
			success: true,
			message: "Partition updated successfully",
			data: partition
		})
	})
	
	router.delete("/:id", async (req, res) => {
		const partition = await deletePartition(Number(req.params.id))
		res.json({
			success: true,
			message: "Partition deleted successfully",
			data: partition
		})
	})

	return router
}