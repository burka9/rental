import { Router } from 'express'
import { getBank, createBank, updateBank, deleteBank } from '../controller/bank.controller'

export default function(): Router {
    const router = Router()

    // Get all banks or a specific bank
    router.get('/:id?', async (req, res) => {
        try {
            const { id } = req.params
            const bank = await getBank(id ? parseInt(id) : undefined)
            res.json({
                success: true,
                message: "Bank fetched successfully",
                data: bank
            })
        } catch (error) {
            res.status(500).json({ error: (error as Error).message })
        }
    })

    // Create a new bank
    router.post('/', async (req, res) => {
        try {
            const bank = await createBank(req.body)
            res.status(201).json({
                success: true,
                message: "Bank created successfully",
                data: bank
            })
        } catch (error) {
            res.status(400).json({ error: (error as Error).message })
        }
    })

    // Update a bank
    router.put('/:id', async (req, res) => {
        try {
            const { id } = req.params
            const bank = await updateBank(parseInt(id), req.body)
            res.json({
                success: true,
                message: "Bank updated successfully",
                data: bank
            })
        } catch (error) {
            res.status(400).json({ error: (error as Error).message })
        }
    })

    // Delete a bank
    router.delete('/:id', async (req, res) => {
        try {
            const { id } = req.params
            const result = await deleteBank(parseInt(id))
            res.json({
                success: true,
                message: "Bank deleted successfully",
                data: result
            })
        } catch (error) {
            res.status(400).json({ error: (error as Error).message })
        }
    })

    return router
}