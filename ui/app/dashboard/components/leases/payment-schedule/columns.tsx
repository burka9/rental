'use client'

import { PaymentSchedule } from "@/lib/types"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"

export const columns: ColumnDef<PaymentSchedule>[] = [
  {
    accessorKey: "dueDate",
    header: "Due Date",
    cell: ({ row }) => {
      const dueDate = new Date(row.getValue("dueDate"))
      const today = new Date()
      const paidAmount = Number(row.original.paidAmount || 0)
      const payableAmount = Number(row.original.payableAmount || 0)
      const isPastDue = dueDate < today && paidAmount < payableAmount
      
      return (
        <div className={isPastDue ? "text-red-600 font-medium" : ""}>
          {dueDate.toLocaleDateString()}
        </div>
      )
    }
  },
  {
    accessorKey: "payableAmount",
    header: "Amount Due",
    cell: ({ row }) => {
      const amount = Number(row.getValue("payableAmount") || 0)
      return (
        <div className="font-medium">
          {amount.toLocaleString()}
        </div>
      )
    }
  },
  {
    accessorKey: "paidAmount",
    header: "Paid Amount",
    cell: ({ row }) => {
      const paidAmount = Number(row.getValue("paidAmount") || 0)
      const payableAmount = Number(row.original.payableAmount || 0)
      const isPaid = paidAmount >= payableAmount
      const isPartiallyPaid = paidAmount > 0 && paidAmount < payableAmount
      
      return (
        <div className={`font-medium ${
          isPaid ? "text-green-600" : 
          isPartiallyPaid ? "text-yellow-600" : 
          "text-gray-600"
        }`}>
          {paidAmount.toLocaleString()}
        </div>
      )
    }
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const paidAmount = Number(row.original.paidAmount || 0)
      const payableAmount = Number(row.original.payableAmount || 0)
      const dueDate = new Date(row.original.dueDate)
      const today = new Date()
      const isOverdue = dueDate < today
      const isPaid = paidAmount >= payableAmount
      const isPartial = paidAmount > 0 && paidAmount < payableAmount
      
      return (
        <div className="flex gap-1">
          {isPaid ? (
            <Badge variant="default" className="bg-green-600">PAID</Badge>
          ) : (
            <>
              {isPartial && <Badge variant="secondary">PARTIAL</Badge>}
              {isOverdue && <Badge variant="destructive">OVERDUE</Badge>}
              {!isPartial && !isOverdue && <Badge variant="outline">PENDING</Badge>}
            </>
          )}
        </div>
      )
    }
  },
  {
    accessorKey: "paymentDate",
    header: "Payment Date",
    cell: ({ row }) => {
      const paymentDate = row.getValue("paymentDate") as Date | undefined
      return (
        <div>
          {paymentDate ? new Date(paymentDate).toLocaleDateString() : "-"}
        </div>
      )
    }
  },
  {
    accessorKey: "balance",
    header: "Remaining Fee",
    cell: ({ row }) => {
      const payableAmount = Number(row.original.payableAmount || 0)
      const paidAmount = Number(row.original.paidAmount || 0)
      const remainingFee = payableAmount - paidAmount
      return (
        <div className={`font-medium ${remainingFee > 0 ? "text-red-600" : "text-green-600"}`}>
          {remainingFee.toLocaleString()}
        </div>
      )
    }
  }
]
