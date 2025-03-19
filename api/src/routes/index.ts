import { Router } from "express";
import buildingRoutes from "./building.routes";
import roomRoutes from "./room.routes";
import partitionRoutes from "./partition.routes";
import tenantRoutes from "./tenant.routes";
import bankRoutes from "./bank.routes";
import leaseRoutes from "./lease.routes";
import utilRoutes from "./util.routes";

export default function(): Router {
	const router = Router()

	router.get("/", (req, res) => {
		res.send("Hello, world!")
	})

	router.use('/util', utilRoutes())

	router.use("/building", buildingRoutes())
	router.use("/room", roomRoutes())
	router.use("/partition", partitionRoutes())
	router.use("/bank", bankRoutes())

	router.use("/tenant", tenantRoutes())
	router.use("/lease", leaseRoutes())

	return router
}