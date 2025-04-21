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
import { Card, CardContent } from "@/components/ui/card"

export default function Tenants() {
  const searchParams = useSearchParams()
  const { tenants, totalTenants, tenantCurrentPage, tenantPageSize } = useTenantStore()

  useEffect(() => {
    if (searchParams.get("message")) {
      toast.success(searchParams.get("message")!)
    }
  }, [searchParams])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Label className="text-2xl font-bold mb-4">Tenants</Label>
        <Link href={`/dashboard/tenants/view?create=true`}>
          <Button className="bg-slate-800 hover:bg-slate-900">Add New Tenant</Button>
        </Link>
      </div>
      <Card className="border-none shadow-md rounded-lg">
        <CardContent className="pt-6">
          <DataTable
            columns={columns}
            data={tenants}
            totalItems={totalTenants}
            pageSize={tenantPageSize}
            currentPage={tenantCurrentPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}