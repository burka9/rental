import { Router } from 'express'
import { getLease, createLease, updateLease, getLeasesByTenant, deleteLease, getActiveLeases, LeaseRepository, generatePaymentSchedule, regeneratePaymentSchedule, resetAndReconcileSchedules } from '../controller/lease.controller'
import { upload } from '../upload'
import { Lease } from '../entities/Lease.entity'
import { updateRoom } from '../controller/room.controller'
import { PaymentScheduleRepository, reconcilePaymentsWithSchedules } from '../controller/payment.controller'

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

    // dev
    router.post('/regenerate/:id', async (req, res) => {
        try {
            const schedule = await regeneratePaymentSchedule(parseInt(req.params.id))
            
            res.json({
                success: true,
                message: "Payment schedule regenerated successfully",
                data: schedule
            })
        } catch (error) {
            res.status(400).json({ error: (error as Error).message })
        }
    })
    // dev

    router.post('/regenerate-all', async (req, res) => {
        try {
            // Prevent timeout issues
            req.setTimeout(0);
        
            const leaseIds = await LeaseRepository
                .createQueryBuilder("lease")
                .select("lease.id")
                .where("lease.active = true")
                .getRawMany(); // get just ids, not full objects
        
            const failedLeases: number[] = [];
        
            for (const { lease_id } of leaseIds) {
                try {
                    await regeneratePaymentSchedule(lease_id);
                } catch (err: any) {
                    console.error(`Failed lease ${lease_id}:`, err?.message || err);
                    failedLeases.push(lease_id);
                }
        
                // hint to GC by avoiding memory retention
                global.gc?.(); // only if --expose-gc is enabled (optional)
            }
        
            res.json({
                success: true,
                message: "Payment schedules regenerated successfully",
                failedLeases
            });
        } catch (err: any) {
            res.status(400).json({ error: err.message });
        }
    })

    router.delete('/cut-schedules', async (req, res) => {
        try {
            const { cutoffDate } = req.body;
    
            if (!cutoffDate) {
                res.status(400).json({ error: "cutoffDate is required" });
                return
            }
    
            const leases = await LeaseRepository
                .createQueryBuilder("lease")
                .select("lease.id")
                .where("lease.active = true")
                .getRawMany();
    
            const failedLeases: number[] = [];
    
            for (const { lease_id } of leases) {
                try {
                    await resetAndReconcileSchedules(lease_id, new Date(cutoffDate));
                } catch (err: any) {
                    console.error(`Lease ${lease_id} failed:`, err.message || err);
                    failedLeases.push(lease_id);
                }
            }
    
            res.json({
                success: true,
                message: "Schedules cut successfully",
                cutoffDate,
                total: leases.length,
                failedLeases
            });
    
        } catch (error) {
            res.status(400).json({ error: (error as Error).message });
        }
    });
    
    
    router.post('/terminate/:id', async (req, res) => {
        try {
            // check if lease is active
            const lease = await LeaseRepository.findOne({ where: { id: parseInt(req.params.id) } })
            
            if (!lease || !lease.active) {
                res.status(400).json({ error: "Lease is not active" })
                return
            }

            // update lease
            const updatedLease = await updateLease(parseInt(req.params.id), { active: false })

            if (!updatedLease) {
                res.status(404).json({ error: "Lease not found" })
                return
            }
            
            // make room available
            updatedLease.roomIds.forEach((roomId: number) => {
                updateRoom(roomId, { occupied: false })
            })
            
            // remove payment schedules
            await PaymentScheduleRepository.delete({ leaseId: updatedLease.id })

            res.json({
                success: true,
                message: "Lease terminated successfully",
                data: updatedLease
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