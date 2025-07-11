'use client'
import { Payment, ROLES } from "@/lib/types"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
// import { PencilIcon, TrashIcon } from "lucide-react"
import Link from "next/link"
import { toEthiopianDateString } from "@/lib/utils"

export const columns: ColumnDef<Payment>[] = [
	{
		accessorKey: "paidAmount",
		header: "Paid Amount"
	},
	{
		accessorKey: "paymentDate",
		header: "Payment Date",
		cell: ({ row }) => <p>{toEthiopianDateString(new Date(row.original.paymentDate))}</p>
	},
	{
		accessorKey: "bankId",
		header: "Bank Name",
		cell: ({ row }) => <p>{row.original.bank.name}</p>
	},
	{
		accessorKey: "referenceNumber",
		header: "Reference Number"
	},
	{
		accessorKey: "invoiceNumber",
		header: "FS Number"
	},
	{
		accessorKey: "isVerified",
		cell: ({ row }) => row.original.isVerified
			? <p className="bg-green-300 rounded-full text-center">Verified</p>
			: <p className="bg-slate-300 rounded-full text-center"></p>,
		header: "Verified"
	},
	{
		header: "Actions",
		size: 100,
		cell: ({ row }) => {
			return (
				<div className="flex gap-2">
					<Link href={`/dashboard/payments/view?id=${row.original.id}`}>
						<Button
							variant="outline"
							size="sm"
							className="h-8 w-full"
							>
							View Payment
						</Button>
					</Link>
					{
						!row.original.isVerified &&
						<Link href={`/dashboard/payments/verify?id=${row.original.id}`}>
							<Button
								data-roles={[ROLES.SUPERADMIN, ROLES.ADMIN, ROLES.FINANCE_ADMIN]}
								variant="outline"
								size="sm"
								className="h-8 w-full text-white bg-green-700 hover:bg-green-800 hover:text-white"
								>
								Verify
							</Button>
						</Link>
					}
					{/* <Link href={`/dashboard/rooms/view?id=${row.original.id}&edit=true`}>
						<Button
							variant="outline"
							size="sm"
							className="h-8 w-full"
							onClick={() => {}}
						>
							<PencilIcon /> Edit
						</Button>
					</Link>
					<Button
            variant="outline"
            size="sm"
            >
            <TrashIcon /> Delete
          </Button> */}
        </div>
			);
		},
	}
]