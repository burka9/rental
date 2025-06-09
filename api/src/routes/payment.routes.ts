import { Router } from 'express'
import { createPayment, verifyPayment, getPayment, getOverduePaymentSchedule, changeStatus, getPayments } from '../controller/payment.controller'
import { upload } from '../upload';


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
	router.post('/', upload.fields([
		{ name: 'bankSlipAttachment', maxCount: 1 },
	]), async (req, res) => {
			try {
					const paymentData = req.body
					const files = req.files as { [fieldname: string]: Express.Multer.File[] }

					console.log(files)

					paymentData.bankSlipPath = files.bankSlipAttachment ? files.bankSlipAttachment[0].path : undefined

					console.log(paymentData)
					
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

	router.post('/verify', upload.single('bankSlipAttachment'), async (req, res) => {
			try {
					const verificationData = {
							invoiceNumber: req.body.invoiceNumber,
							invoicePath: req.file?.path,
							verified: true,
							verificationDate: new Date()
					}

					const payment = await verifyPayment(parseInt(req.body.id), verificationData)
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
	
	return router
}