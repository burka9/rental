import { Router } from "express";
import multer from "multer";
import path from "path";
import { createTenant, deleteTenant, getTenant, getTenantByPhone, updateTenant } from "../controller/tenant.controller";
import { createLease, updateLease } from "../controller/lease.controller";
import { getPartitions, updatePartition } from "../controller/partition.controller";
import { PaymentType } from "../entities/Lease.entity";
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
		// Accept only pdf files
		if (file.mimetype === "application/pdf") {
			cb(null, true);
		} else {
			cb(null, false);
			return cb(new Error("Only PDF files are allowed!"));
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
			leases: []
		})

		// get the partition ids from the body
		const partitionIds = JSON.parse(body.offices).map((office: any) => office.officeId)

		// check if the selected partitions are occupied
		const selectedPartitions = await getPartitions(partitionIds)
		if (selectedPartitions.some((partition: any) => partition.occupied)) {
			return res.status(400).json({
				success: false,
				message: "Selected partitions are not available"
			})
		}

		// create a lease object with the body
		const lease = await createLease({
			tenant: tenant,
			partitionIds: partitionIds,
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

		// update the partitions to be occupied
		await Promise.all(
      selectedPartitions.map(partition =>
        updatePartition(partition.id, { occupied: true })
      )
    );

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