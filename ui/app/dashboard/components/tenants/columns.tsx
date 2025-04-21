'use client'
import { ColumnActions } from "@/components/columnAction"
import { useTenantStore } from "@/lib/store/tenants"
import { Tenant } from "@/lib/types"
import { ColumnDef } from "@tanstack/react-table"


const RowActions = ({ tenant }: { tenant: Tenant }) => {
	const { deleteTenant } = useTenantStore()
	
	const handleDelete = async () => {
		try {
			await deleteTenant(tenant.id)
			return true
		} catch {
			return false
		}
	}
	
	return <ColumnActions
		removeAction={handleDelete}
		item={{
			item: tenant,
			name: "Tenant",
			link: {
				view: `/dashboard/tenants/view?id=${tenant.id}`,
				edit: `/dashboard/tenants/view?id=${tenant.id}&edit=true`,
			}
		}}
	/>
}

export const columns: ColumnDef<Tenant>[] = [
	{
		header: "Share",
		// share holder should have a green tick
		cell: ({ row }) => <p className="text-md">{ row.original.isShareholder ? "✅" : "" }</p>
	},
	{
		accessorKey: "name",
		header: "Full Name"
	},
	{
		accessorKey: "phone",
		header: "Phone Number"
	},
	{
		accessorKey: "address",
		header: "Address"
	},
	{
		accessorKey: "tinNumber",
		header: "TIN"
	},
	// {
	// 	header: "Lease",
	// 	cell: ({ row }) => row.original.leases?.length
	// },
	{
		header: "Actions",
		size: 100,
		cell: ({ row }) => <RowActions tenant={row.original} />
	}
]