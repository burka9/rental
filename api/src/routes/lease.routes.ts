import { Router } from 'express'
import { getLease, createLease, updateLease, getLeasesByTenant, deleteLease, getActiveLeases } from '../controller/lease.controller'

export default function(): Router {
    const router = Router()

    // Get all leases or a specific lease
    router.get('/:id?', async (req, res) => {
        try {
            const { id } = req.params
            const lease = await getLease(id ? parseInt(id) : undefined)
            res.json({
                success: true,
                message: "Lease fetched successfully",
                data: lease
            })
        } catch (error) {
            res.status(500).json({ error: (error as Error).message })
        }
    })

    // Create a new lease
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

    // Update a lease
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

    // Delete a lease
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