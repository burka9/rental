"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { PlusCircle, Users } from "lucide-react"

// Store
import { useTenantStore } from "@/lib/store/tenants"
import { useStore } from "@/lib/store"

// Components
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DataTable } from "./data-table"
import { columns } from "./columns"
import { Badge } from "@/components/ui/badge"
import { ROLES } from "@/lib/types"
import { axios } from "@/lib/axios"

export default function Tenants() {
  const searchParams = useSearchParams()
  const { 
    tenants, 
    totalTenants, 
    tenantCurrentPage, 
    tenantPageSize, 
    fetchTenants,
  } = useTenantStore()

  const { user } = useStore()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [roomSearchQuery, setRoomSearchQuery] = useState("")
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // Handle search with debounce for name/phone search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isInitialLoad) {
        setIsInitialLoad(false)
        return
      }
      fetchTenants(1, tenantPageSize, searchQuery, "all", roomSearchQuery || "all")
    }, 500)

    return () => clearTimeout(timer)
  }, [searchQuery, roomSearchQuery, isInitialLoad, fetchTenants, tenantPageSize])
  
  // Handle room search
  const handleRoomSearch = (roomName: string) => {
    setRoomSearchQuery(roomName)
    // Reset to first page when searching
    if (tenantCurrentPage !== 1) {
      fetchTenants(1, tenantPageSize, searchQuery, "all", roomName || "all")
    }
  }

  // Handle initial load and URL messages
  useEffect(() => {
    if (searchParams.get("message")) {
      toast.success(searchParams.get("message")!)
    }
    
    // Initial fetch
    fetchTenants(tenantCurrentPage, tenantPageSize, searchQuery)
  }, [searchParams, fetchTenants, tenantCurrentPage, tenantPageSize, searchQuery])

  // Handle page changes
  const handlePageChange = (page: number) => {
    fetchTenants(page, tenantPageSize, searchQuery)
  }

  // Handle page size changes
  const handlePageSizeChange = (size: number) => {
    fetchTenants(1, size, searchQuery)
  }

  const [isDownloading, setIsDownloading] = useState(false)

  const exportTenants = async () => {
    setIsDownloading(true);
    try {
      const response = await axios.get('/report/export-tenants', {
        headers: {
          Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          Authorization: `Bearer ${user?.token}`,
        },
        responseType: 'blob', // Handle binary data
      });
  
      if (!response.data) {
        throw new Error('Failed to generate report');
      }
  
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tenants-report-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
  
      toast.success('Report downloaded successfully');
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    } finally {
      setIsDownloading(false);
    }
  };
  
  // Calculate pagination values (commented out as not currently used but may be needed later)
  // const pageIndex = tenantCurrentPage - 1
  // const totalPages = Math.ceil(totalTenants / tenantPageSize) || 1

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Tenants</h1>
          <Badge variant="outline" className="ml-2">
            {totalTenants} {totalTenants === 1 ? 'tenant' : 'tenants'}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button
            data-roles={[ROLES.SUPERADMIN, ROLES.ADMIN]}
            onClick={() => {
              exportTenants()
            }}
            disabled={isDownloading}
          >
            {isDownloading ? 'Downloading...' : 'Export to Excel'}
          </Button>
          <Link href="/dashboard/tenants/view?create=true">
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Add Tenant
            </Button>
          </Link>
        </div>
      </div>

      <p className="text-muted-foreground">
        Manage your tenants, view lease agreements, and track payments in one place.
      </p>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Tenant Directory</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={tenants}
            totalItems={totalTenants}
            pageSize={tenantPageSize}
            currentPage={tenantCurrentPage}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onRoomSearch={handleRoomSearch}
            onSearch={setSearchQuery}
            searchValue={searchQuery}
          />
        </CardContent>
      </Card>
    </div>
  );
}