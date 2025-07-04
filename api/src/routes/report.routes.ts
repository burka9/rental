import { Router } from "express";
import { getBasicReports, getAllBuildingsReport, tempPDF, exportTenantsToExcel } from "../controller/report.controller";


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

	router.get('/export-tenants', async (req, res) => {
		try {
			const data = await exportTenantsToExcel()
			res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
			res.setHeader('Content-Disposition', `attachment; filename=tenants-report-${new Date().toISOString().split('T')[0]}.xlsx`);
			res.send(data);
		} catch (error) {
			console.error('Error exporting tenants:', error);
			res.status(500).json({
				success: false,
				message: 'Failed to export tenants',
				error: error instanceof Error ? error.message : 'Unknown error occurred'
			});
		}
	})
	
	return router
}