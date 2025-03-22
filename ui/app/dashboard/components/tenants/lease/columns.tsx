'use client'
import { Lease } from "@/lib/types"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { PencilIcon, TrashIcon } from "lucide-react"
import Link from "next/link"

export const columns: ColumnDef<Lease>[] = [
	{
		accessorKey: "startDate",
		header: "Start Date",
		cell: ({ row }) => {
			return (
				<div>
					{row.getValue("startDate") ? new Date(row.getValue("startDate")).toDateString() : ""}
				</div>
			)
		}
	},
	{
		accessorKey: "endDate",
		header: "End Date",
		cell: ({ row }) => {
			return (
				<div>
					{row.getValue("endDate") ? new Date(row.getValue("endDate")).toDateString() : ""}
				</div>
			)
		}
	},
	{
		accessorKey: "paymentIntervalInMonths",
		header: "Payment Interval",
	},
	{
		header: "Payment Amount",
		cell: ({ row }) => {
			const { base, utility } = row.original.paymentAmountPerMonth
			return (
				<div>
					{Number(base) + Number(utility)}
				</div>
			)
		}
	},
	{
		accessorKey: "deposit",
		header: "Deposit",
	},
	{
		header: "Actions",
		cell: ({ row }) => {
			return (
				<div className="flex gap-2">
					<Link href={`/dashboard/leases/view?id=${row.original.id}`}>
						<Button
							variant="outline"
							size="sm"
							className="h-8 w-full"
							>
							View Lease
						</Button>
					</Link>
					<Link href={`/dashboard/leases/view?id=${row.original.id}&edit=true`}>
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