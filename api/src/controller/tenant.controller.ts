import { Database } from "../db"
import { Tenant } from "../entities/Tenant.entity"

export const TenantRepository = Database.getRepository(Tenant)

export async function getTenant(id?: number) {
    if (id) {
        return await TenantRepository.findOne({
            where: { id },
            relations: ["leases"]
        })
    }
    return await TenantRepository.find({
        relations: ["leases"]
    })
}

export async function getTenantByPhone(phone: string) {
    return await TenantRepository.findOne({
        where: { phone }
    })
}

export async function createTenant(tenant: Partial<Tenant>) {
    const newTenant = TenantRepository.create(tenant)
    return await TenantRepository.save(newTenant)
}

export async function updateTenant(id: number, tenant: Partial<Tenant>) {
	const existingTenant = await TenantRepository.findOne({
		where: { id }
	})

	if (!existingTenant) {
		throw new Error("Tenant not found")
	}

	await TenantRepository.update(id, tenant)
	return await TenantRepository.findOne({
		where: { id }
	})
}

export async function deleteTenant(id: number) {
    const deletedTenant = await TenantRepository.delete(id)
    return deletedTenant
}