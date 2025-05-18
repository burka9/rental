'use client'
import { Lease, ROLES } from "@/lib/types"
import { ColumnDef } from "@tanstack/react-table"
import { ColumnActions } from "@/components/columnAction"
// import { usePropertyStore } from "@/lib/store/property"

const LeaseActions = ({ lease }: { lease: Lease }) => {
	// const { deleteLease } = usePropertyStore();

	const handleDelete = async () => {
		try {
			// await deleteLease(lease.id)
			return true
		} catch {
			return false
		}
	};

	return <ColumnActions
			removeAction={handleDelete}
			item={{
				item: lease,
				name: "Lease",
				link: {
					view: `/dashboard/leases/view?id=${lease.id}`,
					edit: `/dashboard/leases/view?id=${lease.id}&edit=true`,
				},
				role: {
					view: Object.values(ROLES),
					edit: [ROLES.SUPERADMIN, ROLES.ADMIN],
					remove: [ROLES.SUPERADMIN],
				}
			}}
		/>
};

export const columns: ColumnDef<Lease>[] = [
	{
		"accessorKey": "id",
		"header": "Lease #ID"
	},
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
		cell: ({ row }) => <LeaseActions lease={row.original} />,
	}
]