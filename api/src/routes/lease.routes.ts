import { Router } from 'express'
import { getLease, createLease, updateLease, getLeasesByTenant, deleteLease, getActiveLeases, LeaseRepository } from '../controller/lease.controller'
import { upload } from '../upload'
import { Lease } from '../entities/Lease.entity'

export default function(): Router {
    const router = Router()

    router.get('/:id?', async (req, res) => {
        try {
            const { id } = req.params
            const { page, limit } = req.query

            const pageNum = page ? parseInt(page as string) : 1
            const limitNum = limit ? parseInt(limit as string) : 10

            const lease = await getLease(
                id ? parseInt(id) : undefined,
                pageNum,
                limitNum
            )
            res.json({
                success: true,
                message: "Lease fetched successfully",
                data: lease
            })
        } catch (error) {
            res.status(500).json({ error: (error as Error).message })
        }
    })

    router.post('/', async (req, res) => {
        try {
            const lease = await createLease(req.body)
            res.status(201).json({
                success: true,
                message: "Lease created successfully",
                data: lease
            })
        } catch (error) {
            res.status(400).json({ error: (error as Error).message })
        }
    })

    router.post('/add-files/:id', upload.array('files'), async (req, res) => {
        try {
            const lease = await getLease(parseInt(req.params.id)) as Lease

            console.log(req.files)

            if (!lease) {
                res.status(404).json({ error: "Lease not found" })
                return
            }

            const files = req.files as Express.Multer.File[]

            if (!files || files.length === 0) {
                res.status(400).json({ error: "No files uploaded" })
                return
            }

            const updatedLease = await LeaseRepository.update(lease.id, {
                files: [...lease.files, ...files.map(file => ({
                    filename: file.originalname,
                    path: file.path
                }))]
            })

            res.json({
                success: true,
                message: "Files uploaded successfully",
                data: updatedLease
            })
        } catch (error) {
            console.log(error)
            res.status(400).json({ error: (error as Error).message })
        }
    })

    router.post('/remove-file', async (req, res) => {
        try {
            const { leaseId, filePath } = req.body
            
            const lease = await getLease(leaseId) as Lease

            const result = await LeaseRepository.update(lease.id, {
                files: lease.files.filter(file => file.path !== filePath)
            })
            
            res.json({
                success: true,
                message: "File removed successfully",
                data: result
            })
        } catch (error) {
            res.status(400).json({ error: (error as Error).message })
        }
    })

    router.put('/:id', async (req, res) => {
        try {
            const { id } = req.params
            const lease = await updateLease(parseInt(id), req.body)
            res.json({
                success: true,
                message: "Lease updated successfully",
                data: lease
            })
        } catch (error) {
            res.status(400).json({ error: (error as Error).message })
        }
    })

    router.delete('/:id', async (req, res) => {
        try {
            const { id } = req.params
            const result = await deleteLease(parseInt(id))
            res.json({
                success: true,
                message: "Lease deleted successfully",
                data: result
            })
        } catch (error) {
            res.status(400).json({ error: (error as Error).message })
        }
    })

    return router
}