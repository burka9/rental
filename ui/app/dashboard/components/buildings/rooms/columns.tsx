'use client'
import { Room } from "@/lib/types"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { PencilIcon, TrashIcon } from "lucide-react"
import Link from "next/link"

export const columns: ColumnDef<Room>[] = [
	{
		accessorKey: "number",
		header: "Room Number"
	},
	{
		accessorKey: "floorNumber",
		header: "Floor number"
	},
	{
		header: "Actions",
		size: 100,
		cell: ({ row }) => {
			return (
				<div className="flex gap-2">
					<Link href={`/dashboard/rooms/view?id=${row.original.id}`}>
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
          </Button>
        </div>
			);
		},
	}
]