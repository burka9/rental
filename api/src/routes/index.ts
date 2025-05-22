import { Router } from "express";
import buildingRoutes from "./building.routes";
import roomRoutes from "./room.routes";
import tenantRoutes from "./tenant.routes";
import bankRoutes from "./bank.routes";
import leaseRoutes from "./lease.routes";
import utilRoutes from "./util.routes";
import paymentRoutes from "./payment.routes";
import reportRoutes from "./report.routes";
import authRoutes from "./auth.routes";
import userRoutes from "./user.routes";

export default function(): Router {
	const router = Router()

	router.get("/", (req, res) => {
		res.send("Hello, world!")
	})

	router.use('/auth', authRoutes())
	
	router.use('/util', utilRoutes())

	router.use("/building", buildingRoutes())
	router.use("/room", roomRoutes())
	router.use("/bank", bankRoutes())

	router.use("/tenant", tenantRoutes())
	router.use("/lease", leaseRoutes())
	router.use("/payment", paymentRoutes())
	router.use('/report', reportRoutes())
	router.use('/users', userRoutes())

	return router
}