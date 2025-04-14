import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import { createPayment, verifyPayment, getPayment, getOverduePaymentSchedule, changeStatus } from '../controller/payment.controller'

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
	router.post('/', upload.single('bankSlip'), async (req, res) => {
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