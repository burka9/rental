import { Router } from "express";
import { getBasicReports, getAllBuildingsReport, tempPDF } from "../controller/report.controller";


export default function(): Router {
	const router = Router()

	router.get("/basic", async (req, res) => {
		res.json({
			success: true,
			message: "Reports fetched successfully",
			data: await getBasicReports()
		})
	})
	
	router.get('/pdf-template', async (req, res) => {
		const data = await getAllBuildingsReport()
		const pdf = tempPDF({ data })
		
		// res.json({
		// 	success: true,
		// 	message: "PDF template fetched successfully",
		// 	data: pdf
		// })

		res.download(pdf)
	})
	
	return router
}