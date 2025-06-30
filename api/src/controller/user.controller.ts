import { Database } from "../db";
import { ROLES } from "../entities/User.entity";
import { User } from "../entities/User.entity";
import { Building } from "../entities/Building.entity";
import { UserRepository } from "./util.controller";
import { compareSync, hashSync } from "bcrypt";
import { Session } from "../entities/User.entity";

export const SessionRepository = Database.getRepository(Session)

export const getUser = async ({ skip, take, search }: { skip: number, take: number, search: string }) => {
	const query = UserRepository.createQueryBuilder("user")
		.leftJoinAndSelect("user.building", "building")
		.select([
			"user.id",
			"user.phone",
			"user.role",
			"user.buildingId",
			"user.isActive",
			"building.name",
		])
		

	if (search) {
		query.where("user.phone LIKE :search", { search: `%${search}%` })
	}
	
	query.skip(skip).take(take)

	return query.getManyAndCount()
}

export const createUser = async (user: Partial<User>) => {
	const { phone, password, role, buildingId } = user
	
	if (!role || !Object.values(ROLES).includes(role)) {
		throw new Error("Invalid role")
	}
	
	if (!phone || !password) {
		throw new Error("Phone and password are required")
	}
	
	if (role === ROLES.BUILDING_ADMIN && !buildingId) {
		throw new Error("Building ID is required for BUILDING_ADMIN")
	}
	
	const building = await Database.getRepository(Building).findOneBy({ id: buildingId })
	if (!building) {
		throw new Error("Building not found")
	}
	
	const newUser = await UserRepository.save({
		phone,
		password: hashSync(password, 10),
		role,
		buildingId,
		building,
	})

	return {
		success: true,
		message: "User created successfully",
		data: {
			id: newUser.id,
			phone: newUser.phone,
			role: newUser.role,
			buildingId: newUser.buildingId,
			isActive: newUser.isActive,
		},
	}
}


export const changePassword = async (phone: string, oldPassword: string, newPassword: string) => {
	const user = await UserRepository.findOneBy({ phone })
	if (!user) {
		throw new Error("User not found")
	}
	
	if (!compareSync(oldPassword, user.password)) {
		throw new Error("Invalid old password")
	}
	
	user.password = hashSync(newPassword, 10)
	await UserRepository.save(user)
	return {
		success: true,
		message: "Password changed successfully",
		data: {
			id: user.id,
			phone: user.phone,
			role: user.role,
			buildingId: user.buildingId,
			isActive: user.isActive,
		},
	}
}

export const resetPassword = async (phone: string, newPassword: string) => {
	const user = await UserRepository.findOneBy({ phone })
	if (!user) {
		throw new Error("User not found")
	}
	
	user.password = hashSync(newPassword, 10)
	await UserRepository.save(user)
	return {
		success: true,
		message: "Password reset successfully",
		data: {
			id: user.id,
			phone: user.phone,
			role: user.role,
			buildingId: user.buildingId,
			isActive: user.isActive,
		},
	}
}

export const revokeSession = async (sessionId: number) => {
	const session = await SessionRepository.findOneBy({ id: sessionId })
	
	if (!session) {
		throw new Error("Session not found")
	}
	
	await SessionRepository.remove(session)
	return {
		success: true,
		message: "Session revoked successfully",
		data: session,
	}
}

export const revokeAllSessions = async (userId: number) => {
	const sessions = await SessionRepository.find({ where: { userId } })
	if (!sessions) {
		throw new Error("No sessions found")
	}
	
	await SessionRepository.remove(sessions)
	return {
		success: true,
		message: "All sessions revoked successfully",
		data: sessions,
	}
}
