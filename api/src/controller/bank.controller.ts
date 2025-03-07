import { Database } from "../db"
import { Bank } from "../entities/Bank.entity"

export const BankRepository = Database.getRepository(Bank)

export async function getBank(id?: number) {
    if (id) {
        return await BankRepository.findOne({
            where: { id }
        })
    }
    return await BankRepository.find()
}

export async function createBank(bank: Partial<Bank>) {
    const newBank = BankRepository.create(bank)
    return await BankRepository.save(newBank)
}

export async function updateBank(id: number, bank: Partial<Bank>) {
    const existingBank = await BankRepository.findOne({
        where: { id }
    })

    if (!existingBank) {
        throw new Error("Bank not found")
    }

    await BankRepository.update(id, bank)
    return await BankRepository.findOne({
        where: { id }
    })
}

export async function deleteBank(id: number) {
    const deletedBank = await BankRepository.delete(id)
    return deletedBank
} 