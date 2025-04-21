'use client'
import { Room } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import { usePropertyStore } from "@/lib/store/property";
import { ColumnActions } from "@/components/columnAction";

const RoomActions = ({ room }: { room: Room }) => {
  const { deleteRoom } = usePropertyStore();

	const handleDelete = async () => {
    try {
			await deleteRoom(room.id)
			return true
		} catch {
			return false
		}
  };

  return <ColumnActions
			removeAction={handleDelete}
			item={{
				item: room,
				name: "Room",
				link: {
					view: `/dashboard/rooms/view?id=${room.id}`,
					edit: `/dashboard/rooms/view?id=${room.id}&edit=true`,
				}
			}}
		/>
};

export const columns: ColumnDef<Room>[] = [
  {
    accessorKey: "name",
    header: "Room Name",
    cell: ({ row }) => (
      <span className="text-gray-800 font-medium">{row.original.name}</span>
    ),
  },
  {
    accessorKey: "floorNumber",
    header: "Floor Number",
    cell: ({ row }) => (
      <span className="text-gray-600">{row.original.floorNumber}</span>
    ),
  },
  {
    accessorKey: "sizeInSquareMeters",
    header: "Size (sqm)",
    cell: ({ row }) => (
      <span className="text-gray-600">{row.original.sizeInSquareMeters ?? '-'}</span>
    ),
  },
  {
    accessorKey: "occupied",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
          row.original.occupied
            ? "bg-red-100 text-red-800"
            : "bg-green-100 text-green-800"
        }`}
      >
        {row.original.occupied ? "Rented" : "Free"}
      </span>
    ),
  },
  {
    header: "Actions",
    cell: ({ row }) => <RoomActions room={row.original} />,
  },
];