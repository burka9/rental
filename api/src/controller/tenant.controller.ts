import { FindOptionsWhere } from "typeorm";
import { Database } from "../db"
import { Tenant } from "../entities/Tenant.entity"

export const TenantRepository = Database.getRepository(Tenant)

export async function getTenant({
    skip = 0,
    take = 10,
    search = "",
    isShareholder,
    officeNumber,
  }: {
    skip?: number;
    take?: number;
    search?: string;
    isShareholder?: string; // "true", "false", or undefined
    officeNumber?: string;
  }): Promise<[Tenant[], number]> {
    const query = TenantRepository.createQueryBuilder("tenant");
  
    // Apply search filter on name or phone
    if (search) {
      query.where("tenant.name LIKE :search OR tenant.phone LIKE :search", { 
        search: `%${search}%` 
      });
    }

    // Apply office filter
    if (officeNumber && officeNumber !== "all") {
      query
        .leftJoinAndSelect("tenant.leases", "leases")
        .leftJoinAndSelect("rooms", "rooms", "FIND_IN_SET(rooms.id, leases.roomIds)")
        .andWhere("rooms.name = :officeNumber", {
          officeNumber,
        });
    }

    // Apply shareholder filter
    if (isShareholder === "true" || isShareholder === "false") {
      query.andWhere("tenant.isShareholder = :isShareholder", { 
        isShareholder: isShareholder === "true" 
      });
    }
  
    // Apply pagination
    query.skip(skip).take(take);
  
    // Execute query and return results with total count
    return query.getManyAndCount();
  }

export async function getSingleTenant(options: FindOptionsWhere<Tenant>) {
    return TenantRepository.findOne({
        where: options,
        relations: ["leases"]
    })
}

export async function createTenant(tenant: Partial<Tenant>) {
    const newTenant = TenantRepository.create(tenant)
    return await TenantRepository.save(newTenant)
}

export async function updateTenant(id: number, tenant: Partial<Tenant>) {
    const existingTenant = await TenantRepository.findOne({
        where: { id },
        relations: ["leases"]
    })

    if (!existingTenant) {
        throw new Error("Tenant not found")
    }

    await TenantRepository.update(id, tenant)
    return await TenantRepository.findOne({
        where: { id },
        relations: ["leases"]
    })
}

export async function deleteTenant(id: number) {
    const deletedTenant = await TenantRepository.delete(id)
    return deletedTenant
}