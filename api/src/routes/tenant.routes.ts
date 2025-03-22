import { Router } from "express";
import multer from "multer";
import path from "path";
import { createTenant, deleteTenant, getTenant, getTenantByPhone, updateTenant } from "../controller/tenant.controller";
import { createLease, updateLease } from "../controller/lease.controller";
import { PaymentType } from "../entities/Lease.entity";
import { getRoom, getRooms, updateRoom } from "../controller/room.controller";

// Configure multer for file upload
const storage = multer.diskStorage({
	destination: function (req: any, file: any, cb: any) {
		cb(null, "uploads/agreements"); // Make sure this directory exists
	},
	filename: function (req: any, file: any, cb: any) {
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
		cb(null, "agreement-" + uniqueSuffix + path.extname(file.originalname));
	}
});

const upload = multer({
	storage: storage,
	fileFilter: (req: any, file: any, cb: any) => {
		// Accept only pdf files and images
		if (file.mimetype === "application/pdf" || 
			file.mimetype.startsWith("image/")) {
			cb(null, true);
		} else {
			cb(null, false);
			return cb(new Error("Only PDF and image files are allowed!"));
		}
	},
	limits: {
		fileSize: 5 * 1024 * 1024 // 5MB limit
	}
});

export default function(): Router {
	const router = Router()

	router.get("/", async (req, res) => {
		const tenants = await getTenant()
		res.json({
			success: true,
			message: "Tenants fetched successfully",
			data: tenants
		})
	})

	router.get("/:id", async (req, res) => {
		const tenant = await getTenant(Number(req.params.id))
		res.json({
			success: true,
			message: "Tenant fetched successfully",
			data: tenant
		})
	})

	router.post("/", upload.single("agreementFile"), async (req: any, res: any) => {
		const body = req.body
		const file = req.file
		
		// exit if user.phone is already in the database
		const existingTenant = await getTenantByPhone(body.phone)
		if (existingTenant) {
			return res.status(400).json({
				success: false,
				message: "Tenant already exists"
			})
		}

		// create a tenant object
		const tenant = await createTenant({
			name: body.name,
			phone: body.phone,
			address: body.address,
			tinNumber: body.tinNumber,
			isShareholder: body.isShareholder,
			leases: []
		})

		// get the partition ids from the body
		const roomIds = JSON.parse(body.rooms).map((room: any) => room.id)

		// check if the selected rooms are occupied
		const selectedRooms = await getRooms(roomIds)
		if (selectedRooms.some((room: any) => room.occupied)) {
			return res.status(400).json({
				success: false,
				message: "Selected rooms are not available"
			})
		}
		
		// create a lease object with the body
		const lease = await createLease({
			tenant: tenant,
			roomIds: roomIds,
			startDate: body.startDate,
			endDate: body.endDate,
			paymentIntervalInMonths: body.paymentIntervalInMonths,
			paymentAmountPerMonth: JSON.parse(body.paymentAmountPerMonth),
			deposit: body.deposit,
			lateFeeType: body.lateFeeType,
			lateFee: body.lateFee,
			initialPayment: {
				amount: body.initialPaymentAmount,
				paymentDate: body.initialPaymentDate,
			},
			lateFeeGracePeriodInDays: 0,
			active: true,
			paymentType: PaymentType.PREPAID,
			files: [{
				filename: file?.filename || "",
				path: file?.path || ""
			}]
		})

		if (!lease) {
			return res.status(400).json({
				success: false,
				message: "Lease creation failed"
			})
		}

		// update the rooms to be occupied
		for await (const room of selectedRooms) {
			await updateRoom(room.id, { occupied: true })
		}

		// update the tenant with the lease id
		// await updateTenant(tenant.id, { leases: [lease] })
		
		res.json({
			success: true,
			message: "Tenant created successfully",
			data: tenant
		})
	})

	router.put("/:id", async (req, res) => {
		const tenant = await updateTenant(Number(req.params.id), req.body)
		res.json({
			success: true,
			message: "Tenant updated successfully",
			data: tenant
		})
	})

	router.delete("/:id", async (req, res) => {
		const tenant = await deleteTenant(Number(req.params.id))
		res.json({
			success: true,
			message: "Tenant deleted successfully",
			data: tenant
		})
	})

	return router
}