import { Database } from "../db";
import { Notification } from "../entities/Notification.entity";

export const NotificationRepository = Database.getRepository(Notification)


export async function createNotification(notification: Partial<Notification>) {
	const newNotification = NotificationRepository.create(notification)
	return await NotificationRepository.save(newNotification)
}

export async function updateNotification(id: number, notification: Partial<Notification>) {
	const updatedNotification = await NotificationRepository.update(id, notification)
	return updatedNotification
}
