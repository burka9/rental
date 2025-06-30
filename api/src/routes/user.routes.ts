import { Router } from "express";
import { getUser, createUser, resetPassword, changePassword, revokeAllSessions, revokeSession } from "../controller/user.controller";
import { User } from "../entities/User.entity";
import { verifyUser, verifyToken, isAdmin } from "./auth.routes";
import { ROLES } from "../entities/User.entity";

export default function(): Router {
	const router = Router()

	router.get("/", verifyToken, verifyUser, isAdmin, async (req, res) => {
		try {
			const page = parseInt(req.query.page as string) || 1;
			const limit = parseInt(req.query.limit as string) || 10;
			const search = (req.query.search as string) || "";
			const skip = (page - 1) * limit;
			const [users, total] = await getUser({ 
				skip, 
				take: limit, 
				search 
			});
			res.json({
				success: true,
				message: "Users fetched successfully",
				data: {
					users,
					pagination: {
						page,
						limit,
						total,
						totalPages: Math.ceil(total / limit),
					},
				},
			});
		} catch (error: any) {
			res.status(500).json({
				success: false,
				message: "Error fetching users",
				error: error.message,
			});
		}
	})

	router.get('/roles', verifyToken, verifyUser, isAdmin, async (req, res) => {
		res.json({
			success: true,
			message: "Roles fetched successfully",
			data: Object.values(ROLES),
		})
	})
	
	router.post("/", verifyToken, verifyUser, isAdmin, async (req, res) => {
		const body = req.body as Partial<User>
		const newUser = await createUser(body)
		res.json({
			success: true,
			message: "User created successfully",
			data: newUser
		})
	})

	router.post("/change-password", verifyToken, verifyUser, async (req, res) => {
		const { oldPassword, newPassword } = req.body
		const changedUser = await changePassword(res.locals.user.phone, oldPassword, newPassword)
		await revokeAllSessions(res.locals.user.id)
		res.json({
			success: true,
			message: "Password changed successfully",
			data: changedUser
		})
	})

	router.post("/revoke-session", verifyToken, verifyUser, async (req, res) => {
		const { sessionId } = req.body
		const revokedSession = await revokeSession(sessionId)
		res.json({
			success: true,
			message: "Session revoked successfully",
			data: revokedSession
		})
	})

	router.post("/revoke-all-sessions", verifyToken, verifyUser, async (req, res) => {
		const revokedSessions = await revokeAllSessions(res.locals.user.id)
		res.json({
			success: true,
			message: "All sessions revoked successfully",
			data: revokedSessions
		})
	})

	router.post("/reset-password", verifyToken, verifyUser, isAdmin, async (req, res) => {
		const { phone, newPassword } = req.body
		const resetUser = await resetPassword(phone, newPassword)
		res.json({
			success: true,
			message: "Password reset successfully",
			data: resetUser
		})
	})
	
	return router
}