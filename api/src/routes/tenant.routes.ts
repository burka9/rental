import { Router } from "express";
import multer from "multer";
import path from "path";
import { createTenant, deleteTenant, getSingleTenant, getTenant, updateTenant } from "../controller/tenant.controller";
import { createLease, updateLease } from "../controller/lease.controller";
import { LateFeeType, PaymentType } from "../entities/Lease.entity";
import { getRoom, getRooms, RoomRepository, updateRoom } from "../controller/room.controller";
import { toGregorian } from "../lib/date-converter";
import { In } from "typeorm";
import { verifyToken, verifyUser } from "./auth.routes";

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req: any, file: any, cb: any) {
    cb(null, "uploads/agreements");
  },
  filename: function (req: any, file: any, cb: any) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "agreement-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req: any, file: any, cb: any) => {
    if (file.mimetype === "application/pdf" || file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and image files are allowed!"), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

export default function (): Router {
  const router = Router();

  router.get("/", verifyToken, verifyUser, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1; // Default to page 1
      const limit = parseInt(req.query.limit as string) || 10; // Default to 10 rows per page
      const search = (req.query.search as string) || ""; // Search term for name or phone
      const isShareholder = (req.query.isShareholder as string) || "all"; // Filter by shareholder status
      const officeNumber = (req.query.officeNumber as string) || "all"; // Filter by office
      const skip = (page - 1) * limit;

      const filters = res.locals.filter

      // Call getTenant with all parameters
      const [tenants, total] = await getTenant({ 
        skip, 
        take: limit, 
        search, 
        isShareholder: isShareholder === "all" ? undefined : isShareholder,
        officeNumber,
        filters
      });

      res.json({
        success: true,
        message: "Tenants fetched successfully",
        data: {
          tenants,
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
        message: "Error fetching tenants",
        error: error.message,
      });
    }
  });

  // Other endpoints remain unchanged
  router.get("/:id", verifyToken, verifyUser, async (req, res) => {
    const tenant = await getSingleTenant({ id: Number(req.params.id) });
    res.json({
      success: true,
      message: "Tenant fetched successfully",
      data: tenant,
    });
  });

  router.post("/", verifyToken, verifyUser, upload.single("agreementFile"), async (req: any, res: any) => {
    const body = req.body;
    const file = req.file;
    
    // const existingTenant = await getSingleTenant({ phone: body.phone });
    // if (existingTenant) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Tenant already exists",
    //   });
    // }

    const roomIds: { buildingId: string; roomId: string }[] = JSON.parse(body.rooms);
    const selectedRooms = await RoomRepository.find({
      where: {
        id: In(roomIds.map((room) => room.roomId)),
        buildingId: In(roomIds.map((room) => room.buildingId)),
      },
    });

    if (selectedRooms.some((room: any) => room.occupied)) {
      return res.status(400).json({
        success: false,
        message: "Selected rooms are not available",
      });
    }

    const tenant = await createTenant({
      name: body.name,
      phone: body.phone,
      address: body.address,
      tinNumber: body.tinNumber,
      isShareholder: body.isShareholder,
      leases: [],
    });

    const startDate = JSON.parse(body.startDate)[0];
    const endDate = JSON.parse(body.endDate)[0];
    const startDateEthiopian = toGregorian([Number(startDate.year), Number(startDate.month), Number(startDate.day)]);
    const endDateEthiopian = toGregorian([Number(endDate.year), Number(endDate.month), Number(endDate.day)]);
    
    console.log(req.body)
    
    const leaseBody = {
      tenant,
      roomIds: roomIds.map((room) => Number(room.roomId)),
      startDate: new Date(startDateEthiopian[0], startDateEthiopian[1] - 1, startDateEthiopian[2]),
      endDate: new Date(endDateEthiopian[0], endDateEthiopian[1] - 1, endDateEthiopian[2]),
      paymentIntervalInMonths: Number(body.paymentIntervalInMonths),
      paymentAmountPerMonth: JSON.parse(body.paymentAmountPerMonth),
      deposit: isNaN(Number(body.deposit)) ? 0 : Number(body.deposit),
      lateFeeType: LateFeeType.PERCENTAGE,
      // lateFeeType: body.lateFeeType,
      lateFee: isNaN(Number(body.lateFee)) ? 0 : Number(body.lateFee),
      // initialPayment: {
        // amount: Number(body.initialPaymentAmount),
        // paymentDate: body.initialPaymentDate,
      // },
      lateFeeGracePeriodInDays: 0,
      active: true,
      paymentType: PaymentType.PREPAID,
      files: file ? [{ filename: file.filename || "", path: file.path || "" }] : [],
    }

    console.log(leaseBody)
    
    const lease = await createLease(leaseBody);

    if (!lease) {
      return res.status(400).json({
        success: false,
        message: "Lease creation failed",
      });
    }

    for await (const room of selectedRooms) {
      await updateRoom(room.id, { occupied: true });
    }

    res.json({
      success: true,
      message: "Tenant created successfully",
      data: tenant,
    });
  });

  router.put("/:id", verifyToken, verifyUser, upload.single("agreementFile"), async (req, res) => {
    const tenant = await updateTenant(Number(req.params.id), req.body);
    res.json({
      success: true,
      message: "Tenant updated successfully",
      data: tenant,
    });
  });

  router.delete("/:id", verifyToken, verifyUser, async (req, res) => {
    const tenant = await deleteTenant(Number(req.params.id));
    res.json({
      success: true,
      message: "Tenant deleted successfully",
      data: tenant,
    });
  });

  return router;
}