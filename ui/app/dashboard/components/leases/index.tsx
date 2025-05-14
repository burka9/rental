'use client'

import { Button } from "@/components/ui/button";
import { useTenantStore } from "@/lib/store/tenants";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner"
import { DataTable } from "./data-table";
import { columns } from "./columns";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Search, Plus } from "lucide-react";

export default function Leases() {
  const searchParams = useSearchParams();
  const { fetchLeases, leases, totalLeases } = useTenantStore();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10); // Matches the default in tenant_store.ts
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch leases with pagination
  useEffect(() => {
    setLoading(true);
    fetchLeases(currentPage, pageSize)
      .then(() => setLoading(false))
      .catch(error => {
        console.log(error);
        setLoading(false);
        toast.error("Failed to fetch leases");
      });
  }, [fetchLeases, currentPage, pageSize]);

  // Handle success message from search params
  useEffect(() => {
    const message = searchParams.get("message");
    if (message) {
      toast.success(message);
    }
  }, [searchParams]);

  // Filter leases based on search term (client-side filtering)
  const filteredLeases = leases.filter(lease =>
    lease.tenant?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lease.id.toString().includes(searchTerm)
  );

  // Pagination calculations
  const totalPages = Math.ceil(totalLeases / pageSize);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leases</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage all lease agreements ({totalLeases} total)
          </p>
        </div>
        <Link href="/dashboard/leases/view?create=true">
          <Button className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Add New Lease
          </Button>
        </Link>
      </div>

      {/* Search and Table Section */}
      <Card className="border-none shadow-lg rounded-lg">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-xl font-semibold text-gray-900">
            Lease Overview
          </CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by tenant or lease ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-200 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : filteredLeases.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No leases found.</p>
            </div>
          ) : (
            <>
              <DataTable columns={columns} data={filteredLeases} />
              
              {/* Pagination Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-6 gap-4">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * pageSize + 1} to{" "}
                  {Math.min(currentPage * pageSize, totalLeases)} of {totalLeases} leases
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="border-gray-200"
                  >
                    Previous
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(page => 
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 2 && page <= currentPage + 2)
                      )
                      .map(page => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "default" : "outline"}
                          size="sm"
                          onClick={() => handlePageChange(page)}
                          className={currentPage === page ? "bg-blue-600 text-white" : "border-gray-200"}
                        >
                          {page}
                        </Button>
                      ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="border-gray-200"
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}