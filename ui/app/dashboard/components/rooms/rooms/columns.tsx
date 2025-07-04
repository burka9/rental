'use client'

import { ROLES, Room } from "@/lib/types"
import { ColumnDef } from "@tanstack/react-table"
import { usePropertyStore } from "@/lib/store/property"
import { ColumnActions } from "@/components/columnAction"
import { Badge } from "@/components/ui/badge"
import { Building, Square, Ruler, Home, CheckCircle, CircleAlert } from "lucide-react"

const RoomActions = ({ room }: { room: Room }) => {
  const { deleteRoom } = usePropertyStore()

  const handleDelete = async () => {
    try {
      await deleteRoom(room.id)
      return true
    } catch {
      return false
    }
  }

  return (
    <div className="flex justify-end pr-4">
      <ColumnActions
        removeAction={handleDelete}
        item={{
          item: room,
          name: "Room",
          link: {
            view: `/dashboard/rooms/view?id=${room.id}`,
            edit: `/dashboard/rooms/view?id=${room.id}&edit=true`,
          },
          role: {
            view: Object.values(ROLES),
            edit: [ROLES.SUPERADMIN, ROLES.ADMIN],
            remove: [ROLES.SUPERADMIN],
          },
        }}
      />
    </div>
  )
}

const BuildingCell = ({ buildingId }: { buildingId: string }) => {
  const { buildings } = usePropertyStore()
  const building = buildings.find((b) => b.id === Number(buildingId))
  
  return (
    <div className="flex items-center gap-2">
      <Building className="h-4 w-4 text-muted-foreground" />
      <span className="font-medium text-foreground">
        {building?.name || "Unknown"}
      </span>
    </div>
  )
}

export const columns: ColumnDef<Room>[] = [
  {
    accessorKey: "name",
    header: "Room Name",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Home className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-foreground">
          {row.original.name}
        </span>
      </div>
    ),
    size: 200,
  },
  {
    accessorKey: "buildingId",
    header: "Building",
    cell: ({ row }) => (
      <BuildingCell buildingId={String(row.original.buildingId)} />
    ),
    size: 200,
  },
  {
    accessorKey: "floorNumber",
    header: "Floor",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Square className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">
          {row.original.floorNumber}
        </span>
      </div>
    ),
    size: 120,
  },
  {
    accessorKey: "sizeInSquareMeters",
    header: "Size",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <Ruler className="h-4 w-4 text-muted-foreground" />
        <span className="text-muted-foreground">
          {row.original.sizeInSquareMeters ? (
            <>{row.original.sizeInSquareMeters} m²</>
          ) : (
            '-'
          )}
        </span>
      </div>
    ),
    size: 100,
  },
  {
    accessorKey: "occupied",
    header: "Status",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        {row.original.occupied ? (
          <>
            <CircleAlert className="h-4 w-4 text-red-500" />
            <Badge variant="outline" className="border-red-200 text-red-600 bg-red-50 px-2 py-0.5 text-xs">
              Occupied
            </Badge>
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4 text-green-500" />
            <Badge variant="outline" className="border-green-200 text-green-600 bg-green-50 px-2 py-0.5 text-xs">
              Available
            </Badge>
          </>
        )}
      </div>
    ),
    size: 120,
  },
  {
    id: "actions",
    cell: ({ row }) => <RoomActions room={row.original} />,
    size: 60,
  },
]