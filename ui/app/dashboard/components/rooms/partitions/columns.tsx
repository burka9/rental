"use client";
import { Partition } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { EyeIcon, PencilIcon, TrashIcon } from "lucide-react";

export const columns: ColumnDef<Partition>[] = [
  {
    accessorKey: "name",
    header: "Office Name",
  },
  {
    accessorKey: "roomId",
    header: "Room ID",
  },
  {
    accessorKey: "buildingId",
    header: "Building ID",
  },
  {
    header: "Status",
    cell: ({ row }) => row.original.occupied
      ? <p className="bg-slate-300 text-center">Rented</p>
      : <p className="bg-green-300 text-center">Free</p>
  },
  {
    accessorKey: "sizeInSquareMeters",
    header: "Size (m)",
  },
  {
    header: "Actions",
    cell: ({ row }) => {
      return (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-full"
            onClick={() => {
              // Assuming router is available in the context or passed as a prop
              location.href = `/dashboard/partitions/view?id=${row.original.id}`;
            }}
          >
            <EyeIcon /> View Partition
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-full"
            onClick={() => {}}
          >
            <PencilIcon /> Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 w-full"
            onClick={() => {}}
          >
            <TrashIcon /> Delete
          </Button>
        </div>
      );
    },
  },
];
