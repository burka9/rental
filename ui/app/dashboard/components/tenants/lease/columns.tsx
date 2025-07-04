'use client'

import { Badge } from "@/components/ui/badge"
import { ColumnActions } from "@/components/columnAction"
import { ColumnDef } from "@tanstack/react-table"
import { Lease, ROLES } from "@/lib/types"
import { toEthiopianDateString } from "@/lib/utils"
import { cn } from "@/lib/utils"

const LeaseActions = ({ lease }: { lease: Lease }) => {
  const handleDelete = async () => {
    try {
      // await deleteLease(lease.id)
      return true
    } catch {
      return false
    }
  }

  return (
    <div className="flex justify-end">
      <ColumnActions
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
    </div>
  )
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

const getStatusBadge = (endDate: string | Date) => {
  const today = new Date()
  const end = new Date(endDate)
  const daysLeft = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  
  if (daysLeft < 0) {
    return <Badge variant="destructive">Expired</Badge>
  } else if (daysLeft <= 30) {
    return <Badge variant="outline" className="border-amber-500 text-amber-500">Ending Soon</Badge>
  } else {
    return <Badge variant="outline" className="border-green-500 text-green-500">Active</Badge>
  }
}

export const columns: ColumnDef<Lease>[] = [
  // {
  //   accessorKey: "id",
  //   header: "Lease #",
  //   cell: ({ row }) => (
  //     <div className="font-medium text-primary">
  //       #{row.getValue("id")}
  //     </div>
  //   ),
  // },
  {
    // accessorKey: "startDate",
    header: "Lease Period",
    cell: ({ row }) => {
      const startDate = row.original.startDate ? new Date(row.original.startDate) : null
      const endDate = row.original.endDate ? new Date(row.original.endDate) : null

      console.log(row.original)
      
      return (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">Start:</span>
            <span className="font-medium">
              {startDate ? toEthiopianDateString(startDate) : "-"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">End:</span>
            <span className={cn(
              "font-medium",
              endDate && endDate < new Date() ? "text-destructive" : ""
            )}>
              {endDate ? toEthiopianDateString(endDate) : "-"}
            </span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "paymentAmountPerMonth",
    header: "Payment Details",
    cell: ({ row }) => {
      const { base, utility } = row.original.paymentAmountPerMonth || { base: 0, utility: 0 }
      const total = Number(base) + Number(utility)
      
      return (
        <div className="space-y-1">
          <div className="font-medium">{formatCurrency(total)}</div>
          <div className="text-xs text-muted-foreground">
            {formatCurrency(Number(base))} + {formatCurrency(Number(utility))} utility
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "paymentIntervalInMonths",
    header: "Interval",
    cell: ({ row }) => {
      const months = row.original.paymentIntervalInMonths as number
      return (
        <Badge variant="outline">
          {months} {months === 1 ? 'Month' : 'Months'}
        </Badge>
      )
    },
  },
  {
    accessorKey: "deposit",
    header: "Deposit",
    cell: ({ row }) => {
      const deposit = Number(row.original.deposit) || 0
      return formatCurrency(deposit)
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const endDate = row.original.endDate
      return endDate ? getStatusBadge(endDate) : null
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <LeaseActions lease={row.original} />,
  },
]