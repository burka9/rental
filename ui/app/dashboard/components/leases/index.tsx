'use client'

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useTenantStore } from "@/lib/store/tenants";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner"
import { DataTable } from "./data-table";
import { columns } from "./columns";
import Link from "next/link";

export default function Leases() {
  const searchParams = useSearchParams()
  const { fetchLeases, leases } = useTenantStore()

  useEffect(() => {
    fetchLeases()
      .then(data => {
        console.log(data)
      })
      .catch(error => {
        console.log(error)
      })
  }, [fetchLeases])

  useEffect(() => {
    if (searchParams.get("message")) {
      toast.success(searchParams.get("message")!)
    }
  }, [searchParams])
  
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Label className="text-2xl font-bold mb-4">Leases</Label>
        <Link href={`/dashboard/leases/view?create=true`}>
          <Button>Add New Lease</Button>
        </Link>
      </div>
      <div className="flex gap-4">
        <DataTable columns={columns} data={leases} />
      </div>
    </div>
  );
}