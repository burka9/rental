"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { useUserStore } from "@/lib/store/users";
import { DataTable } from "./data-table";
import { columns } from "./columns";
import { useStore } from "@/lib/store";

export default function Users() {
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  
  const { users, totalUsers, loading, fetchUsers } = useUserStore();
  const { user } = useStore.getState()

  useEffect(() => {
    fetchUsers(page + 1, pageSize, searchQuery);
  }, [fetchUsers, searchQuery, page, pageSize]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    setPage(0); // Reset to first page on new search
  }, []);

  const handlePageChange = (newPage: number) => {
    setPage(Math.max(0, newPage));
  };

  const handlePageSizeChange = (newSize: number) => {
    setPage(0); // Reset to first page when changing page size
    setPageSize(newSize);
  };

  if (!user && loading && !users.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto py-6 px-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Users</h1>
          <Button asChild>
            <Link href="/dashboard/users/view?create=true">
              <PlusIcon className="mr-2 h-4 w-4" />
              Add User
            </Link>
          </Button>
        </div>

        <DataTable 
          columns={columns} 
          data={users}
          onSearch={handleSearch}
          loading={loading}
          searchPlaceholder="Search users..."
          currentPage={page}
          pageSize={pageSize}
          totalItems={totalUsers}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          title="Users"
          description="Manage system users and their permissions"
        />
      </div>
    </div>
  );
}