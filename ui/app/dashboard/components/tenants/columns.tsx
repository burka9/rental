'use client'
import { Tenant } from "@/lib/types"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { PencilIcon, TrashIcon } from "lucide-react"
import Link from "next/link"

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
	{
		header: "Lease",
		cell: ({ row }) => row.original.leases?.length
	},
	{
		header: "Actions",
		size: 100,
		cell: ({ row }) => {
			return (
				<div className="flex gap-2">
					<Link href={`/dashboard/tenants/view?id=${row.original.id}`}>
						<Button
							variant="outline"
							size="sm"
							className="h-8 w-full"
							>
							View
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