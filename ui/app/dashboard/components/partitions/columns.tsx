"use client";
import { Partition } from "@/lib/types";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { EyeIcon, PencilIcon, TrashIcon } from "lucide-react";
import Link from "next/link";

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
      ? <p className="bg-slate-300 text-center rounded shadow p-1">Rented</p>
      : <p className="bg-green-300 text-center rounded shadow p-1">Free</p>
  },
  {
    accessorKey: "sizeInSquareMeters",
    header: "Size (m)",
  },
  {
    header: "Actions",
    maxSize: 100,
    cell: ({ row }) => {
      return (
        <div className="flex gap-2">
          <Link href={`/dashboard/partitions/view?id=${row.original.id}`}>
            <Button
              variant="outline"
              size="sm"
              >
              <EyeIcon /> View Office
            </Button>
          </Link>
          <Link href={`/dashboard/partitions/view?id=${row.original.id}&edit=true`}>
            <Button
              variant="outline"
              size="sm"
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
  },
];
