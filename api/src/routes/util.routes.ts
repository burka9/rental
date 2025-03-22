import { Router } from "express";
import { getOverview } from "../controller/util.controller";
import { sendNotification } from "../socket";
import { createNotification } from "../controller/notification.controller";

export default function(): Router {
	const router = Router()


	router.get('/overview', async (req, res) => {
		res.json({
			success: true,
			message: "Overview fetched successfully",
			data: await getOverview()
		})
	})


	router.post('/send-notification', async (req, res) => {
		const notification = await createNotification(req.body)

		sendNotification(notification)
		
		res.json({
			success: true,
			message: "Notification sent successfully",
			data: notification
		})
	})

	return router
}