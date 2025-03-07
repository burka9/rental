'use client'
import { Tenant } from "@/lib/types"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { PencilIcon, TrashIcon } from "lucide-react"
import Link from "next/link"

export const columns: ColumnDef<Tenant>[] = [
	{
		accessorKey: "name",
		header: "Tenant Name"
	},
	{
		accessorKey: "phone",
		header: "Tenant Phone"
	},
	{
		accessorKey: "address",
		header: "Tenant Address"
	},
	{
		accessorKey: "tinNumber",
		header: "Tenant TIN"
	},
	{
		header: "Number of Lease",
		cell: ({ row }) => row.original.leases?.length
	},
	{
		header: "Actions",
		cell: ({ row }) => {
			return (
				<div className="flex gap-2">
					<Link href={`/dashboard/tenants/view?id=${row.original.id}`}>
						<Button
							variant="outline"
							size="sm"
							className="h-8 w-full"
							>
							View Tenant
						</Button>
					</Link>
					<Link href={`/dashboard/tenants/view?id=${row.original.id}&edit=true`}>
						<Button
							variant="outline"
							size="sm"
							className="h-8 w-full"
						>
							<PencilIcon /> Edit
						</Button>
					</Link>
					<Button
            variant="outline"
            size="sm"
            onClick={() => {}}
            >
            <TrashIcon /> Delete
          </Button>
        </div>
			);
		},
	}
]