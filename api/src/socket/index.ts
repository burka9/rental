import { Socket } from "socket.io";
import { io } from "..";
import { Notification, NotificationStatus } from "../entities/Notification.entity";
import { updateNotification } from "../controller/notification.controller";

export default function handleSocket(socket: Socket) {
	console.log(`Client connected: ${socket.id}`)

	socket.on('disconnect', () => {
		console.log(`Client disconnected: ${socket.id}`)
	})


	socket.on('status', (status) => {
		console.log(status)

		updateNotification(status.id, {
			status: status.status == "sent"
				? NotificationStatus.SENT
				: status.status == "failed"
					? NotificationStatus.FAILED
					: NotificationStatus.PENDING
		})
	})
}

export async function sendNotification(notification: Notification) {
	io.emit('message', {
		message: notification.message,
		phone: notification.phoneNumber,
		id: notification.id,
		status: notification.status
	})
}