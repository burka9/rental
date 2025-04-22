/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { useEffect } from "react"
import { useTenantStore } from "@/lib/store/tenants"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { DataTable } from "./data-table"
import { columns } from "./columns"

export default function Payments() {
  const searchParams = useSearchParams()
  const { payments, totalPayments, paymentCurrentPage, paymentPageSize } = useTenantStore()

  useEffect(() => {
    if (searchParams.get("message")) {
      toast.success(searchParams.get("message")!)
    }
  }, [searchParams])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Label className="text-2xl font-bold mb-4">Payments</Label>
        <Link href={`/dashboard/payments/view?create=true`}>
          <Button>Add New Payment</Button>
        </Link>
      </div>
      <div className="flex gap-4">
        <DataTable
					columns={columns as any}
					data={payments as any}
          totalItems={totalPayments}
          pageSize={paymentPageSize}
          currentPage={paymentCurrentPage}
        />
      </div>
    </div>
  );
}