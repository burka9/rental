import { Router } from "express";
import { getUser } from "../controller/user.controller";

export default function(): Router {
	const router = Router()

	router.get("/", async (req, res) => {
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
	
	return router
}