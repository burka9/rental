import { Database } from "../db"
import { Payment } from "../entities/Payment.entity"
import { PaymentSchedule } from "../entities/PaymentSchedule.entity"
import { LessThan } from "typeorm"

export const PaymentRepository = Database.getRepository(Payment)
export const PaymentScheduleRepository = Database.getRepository(PaymentSchedule)

export async function getPayment(id?: number) {
    if (id) {
        return PaymentRepository.findOne({
            where: { id },
            relations: ['lease', 'bank']
        })
    }
    return PaymentRepository.find({
        relations: ['lease', 'bank']
    })
}

export async function getOverduePaymentSchedule() {
    const schedules = await PaymentScheduleRepository.find({
        where: {
            dueDate: LessThan(new Date())
        },
        relations: ['lease']
    })

    return schedules
}

export async function createPayment(payment: Partial<Payment>) {
    if (!payment.leaseId || !payment.bankId || !payment.paidAmount) {
        throw new Error("Missing required fields")
    }

    const newPayment = PaymentRepository.create({
        ...payment,
        paymentDate: new Date(),
        isVerified: false,
    })
    return await PaymentRepository.save(newPayment)
}

export async function verifyPayment(id: number, verificationData: Partial<Payment>) {
    const payment = await PaymentRepository.findOne({
        where: { id }
    })

    if (!payment) {
        throw new Error("Payment not found")
    }

    if (payment.isVerified) {
        throw new Error("Payment already verified")
    }

    await PaymentRepository.update(id, verificationData)
    return await PaymentRepository.findOne({
        where: { id },
        relations: ['lease', 'bank']
    })
} 