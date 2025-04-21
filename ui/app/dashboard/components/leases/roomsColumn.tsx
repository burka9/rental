'use client'
import { Room } from "@/lib/types"
import { ColumnDef } from "@tanstack/react-table"

export const columns: ColumnDef<Room>[] = [
	{
		accessorKey: "buildingId",
		header: "Block Number"
	},
	{
		accessorKey: "name",
		header: "Room Name"
	},
	{
		accessorKey: "floorNumber",
		header: "Floor number"
	},
	{
		accessorKey: "sizeInSquareMeters",
		header: "Size in square meters"
	},
	{
		accessorKey: "occupied",
		cell: ({ row }) => row.original.occupied
			? <p className="bg-slate-300 rounded-full text-center">Rented</p>
			: <p className="bg-green-300 rounded-full text-center">Free</p>,
		header: "Occupied"
	},
	{
		header: "Actions",
		cell: () => {
			return (
				<div className="flex gap-2">
					{/* <Link href={`/dashboard/rooms/view?id=${row.original.id}`}>
						<Button
							variant="outline"
							size="sm"
							className="h-8 w-full"
							>
							View Room
						</Button>
					</Link>
					<Link href={`/dashboard/rooms/view?id=${row.original.id}&edit=true`}>
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
					</Button> */}
				</div>
			);
		},
	}
]