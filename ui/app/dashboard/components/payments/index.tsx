/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect } from "react";
import { useTenantStore } from "@/lib/store/tenants";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { DataTable } from "./data-table";
import { columns } from "./columns";

export default function Payments() {
  const searchParams = useSearchParams();
  const { payments, totalPayments, paymentCurrentPage, paymentPageSize } = useTenantStore();

  useEffect(() => {
    if (searchParams.get("message")) {
      toast.success(searchParams.get("message")!);
    }
  }, [searchParams]);

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto py-8">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <Label className="text-3xl font-bold text-gray-900">Payments</Label>
        <Link href="/dashboard/payments/view?create=true">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-md transition-colors">
            Add New Payment
          </Button>
        </Link>
      </div>

      {/* Data Table Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6">
          <DataTable
            columns={columns as any}
            data={payments as any}
            totalItems={totalPayments}
            pageSize={paymentPageSize}
            currentPage={paymentCurrentPage}
          />
        </div>
      </div>
    </div>
  );
}