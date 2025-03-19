'use client'

import { Lease } from "@/lib/types"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { PencilIcon } from "lucide-react"
import Link from "next/link"

export const columns: ColumnDef<Lease>[] = [
  {
    accessorKey: "startDate",
    header: "Start Date",
    cell: ({ row }) => {
      return (
        <div>
          {new Date(row.getValue("startDate")).toLocaleDateString()}
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
          {new Date(row.getValue("endDate")).toLocaleDateString()}
        </div>
      )
    }
  },
  {
    accessorKey: "paymentIntervalInMonths",
    header: "Payment Interval",
    cell: ({ row }) => {
      return (
        <div>
          {row.getValue("paymentIntervalInMonths")} month(s)
        </div>
      )
    }
  },
  {
    header: "Monthly Payment",
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
    id: "actions",
    cell: ({ row }) => {
      return (
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/leases/view?id=${row.original.id}`}>
            <Button variant="ghost" size="icon">
              <PencilIcon className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      )
    }
  }
]
