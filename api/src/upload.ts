import multer from 'multer'
import path from 'path'

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

export const upload = multer({ 
		storage: storage,
		fileFilter: (req, file, cb) => {
				// Accept pdf and image files and docx
				if (file.mimetype === 'application/pdf' || 
						file.mimetype.startsWith('image/') ||
						file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
					) {
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