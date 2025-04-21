import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { createPayment, verifyPayment, getPayment, getOverduePaymentSchedule, changeStatus, getPayments } from '../controller/payment.controller'

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const fileType = file.fieldname === 'bankSlip' ? 'bankslips' : 'invoices'
        cb(null, `uploads/payments/${fileType}`)
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname))
    }
})

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        // Accept pdf and image files
        if (file.mimetype === 'application/pdf' || 
            file.mimetype.startsWith('image/')) {
            cb(null, true)
        } else {
            cb(null, false)
            return cb(new Error('Only PDF and image files are allowed!'))
        }
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
})


export default function(): Router {
	const router = Router()

	// Get all payments
	router.get("/", async (req, res) => {
		try {
			const page = parseInt(req.query.page as string) || 1; // Default to page 1
			const limit = parseInt(req.query.limit as string) || 10; // Default to 10 rows per page
			const search = (req.query.search as string) || ""; // Search term for name or phone
			const isVerified = (req.query.isVerified as string) || "all"; // Filter by shareholder status
			const skip = (page - 1) * limit;

			// Call getTenant with all parameters
			const [payments, total] = await getPayments({ 
				skip, 
				take: limit, 
				search, 
				isVerified: isVerified === "all" ? undefined : isVerified 
			});

			res.json({
				success: true,
				message: "Payments fetched successfully",
				data: {
					payments,
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
				message: "Error fetching payments",
				error: error.message,
			});
		}
	});
	
	// Get payments
	router.get('/un/:id', async (req, res) => {
			try {
					const { id } = req.params
					const payment = await getPayment(id ? parseInt(id) : undefined)
					res.json({
							success: true,
							message: "Payment(s) fetched successfully",
							data: payment
					})
			} catch (error: any) {
					res.status(400).json({ 
							success: false,
							message: error.message 
					})
			}
	})

	// get overdue payments
	router.get('/overdue', async (req, res) => {
			try {
					const payments = await getOverduePaymentSchedule()
					res.json({
							success: true,
							message: "Overdue payments fetched successfully",
							data: payments
					})
				} catch (error: any) {
					res.status(400).json({ 
							success: false,
							message: error.message 
					})
			}
	})

	// Create payment with bank slip
	router.post('/', upload.single('bankSlipAttachment'), async (req, res) => {
			try {
					const paymentData = req.body

					if (req.file) {
							paymentData.bankSlipPath = req.file.path
					}

					const payment = await createPayment(paymentData)
					res.status(201).json({
							success: true,
							message: "Payment created successfully",
							data: payment
					})
			} catch (error: any) {
					res.status(400).json({ 
							success: false,
							message: error.message 
					})
			}
	})

	// Verify payment and attach invoice
	router.post('/:id/verify', upload.single('invoice'), async (req, res) => {
			try {
					const { id } = req.params
					const verificationData = {
							...req.body,
							invoicePath: req.file?.path,
							verified: true,
							verificationDate: new Date()
					}

					const payment = await verifyPayment(parseInt(id), verificationData)
					res.json({
							success: true,
							message: "Payment verified successfully",
							data: payment
					})
			} catch (error: any) {
					res.status(400).json({ 
							success: false,
							message: error.message 
					})
			}
	})

	router.post('/change-status/:scheduleId', async (req, res) => {
		try {
			const { scheduleId } = req.params
			const status = req.body.status

			const payment = await changeStatus(parseInt(scheduleId), status === 'PAID')
			res.json({
				success: true,
				message: "Payment marked as paid successfully",
				data: payment
			})
		} catch (error: any) {
			res.status(400).json({ 
				success: false,
				message: error.message 
			})
		}
	})

	return router
}