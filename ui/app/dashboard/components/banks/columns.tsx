'use client'
import { Bank } from "@/lib/types"
import { ColumnDef } from "@tanstack/react-table"
import { ColumnActions } from "@/components/columnAction"
import { usePropertyStore } from "@/lib/store/property"
import { ROLES } from "@/lib/types"


const BankActions = ({ bank }: { bank: Bank }) => {
	const { deleteBank } = usePropertyStore();

	const handleDelete = async () => {
		try {
			await deleteBank(bank.id ?? 0)
			return true
		} catch {
			return false
		}
	};

	return <ColumnActions
			removeAction={handleDelete}
			item={{
				item: bank,
				name: "Bank",
				link: {
					view: `/dashboard/banks/view?id=${bank.id ?? 0}`,
					edit: `/dashboard/banks/view?id=${bank.id ?? 0}&edit=true`,
				},
				role: {
					view: Object.values(ROLES),
					edit: [ROLES.SUPERADMIN, ROLES.ADMIN],
					remove: [ROLES.SUPERADMIN],
				}
			}}
		/>
};

export const columns: ColumnDef<Bank>[] = [
	{
		accessorKey: "name",
		header: "Bank Number"
	},
	{
		accessorKey: "branch",
		header: "Branch"
	},
	{
		accessorKey: "accountNumber",
		header: "Account Number"
	},
	{
		accessorKey: "ownerName",
		header: "Owner Name"
	},
	{
		header: "Actions",
		cell: ({ row }) => <BankActions bank={row.original} />
	}
]