import { Router } from "express";
import { getBasicReports } from "../controller/report.controller";


export default function(): Router {
	const router = Router()

	router.get("/basic", async (req, res) => {
		res.json({
			success: true,
			message: "Reports fetched successfully",
			data: await getBasicReports()
		})
	})
	
	return router
}