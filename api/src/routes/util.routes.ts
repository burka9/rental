import { Router } from "express";
import { getOverview } from "../controller/util.controller";

export default function(): Router {
	const router = Router()


	router.get('/overview', async (req, res) => {
		res.json({
			data: await getOverview()
		})
	})


	return router
}