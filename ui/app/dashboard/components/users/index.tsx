"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeftIcon, PlusIcon, Search, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useUserStore } from "@/lib/store/users";
import { ROLES } from "@/lib/types";
import { format } from "date-fns";

export default function Users() {
  const router = useRouter();
  const {
    users,
    totalUsers,
    currentPage,
    pageSize,
    loading,
    fetchUsers,
    deleteUser,
  } = useUserStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleting, setIsDeleting] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers(1, 10);
  }, [fetchUsers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(1, 10, searchQuery);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      setIsDeleting(id);
      try {
        const success = await deleteUser(id);
        if (success) {
          fetchUsers(currentPage, pageSize, searchQuery);
        }
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const getRoleBadge = (role: ROLES) => {
    const roleColors = {
      [ROLES.SUPERADMIN]: "bg-purple-100 text-purple-800",
      [ROLES.ADMIN]: "bg-blue-100 text-blue-800",
      [ROLES.BUILDING_ADMIN]: "bg-green-100 text-green-800",
      [ROLES.FINANCE_ADMIN]: "bg-yellow-100 text-yellow-800",
      [ROLES.BOARD_MEMBER]: "bg-indigo-100 text-indigo-800",
      [ROLES.TENANT]: "bg-gray-100 text-gray-800",
      [ROLES.EMPTY]: "bg-gray-100 text-gray-800",
    };

    return (
      <Badge className={`${roleColors[role] || "bg-gray-100"} capitalize`}>
        {role.toLowerCase().replace(/_/g, " ")}
      </Badge>
    );
  };

  if (loading && !users.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto py-6 px-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <Link href="/dashboard">
            <Button variant="outline" size="icon" className="h-8 w-8">
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Users</h1>
          <Badge variant="outline" className="ml-2">
            {totalUsers} {totalUsers === 1 ? "User" : "Users"}
          </Badge>
        </div>
        <Button asChild>
          <Link href="/dashboard/users/new">
            <PlusIcon className="h-4 w-4 mr-2" />
            Add User
          </Link>
        </Button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search users..."
            className="w-full bg-background pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={loading}>
          Search
        </Button>
      </form>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? (
              users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">#{user.id}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>{getRoleBadge(user.role as ROLES)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.isActive ? "default" : "outline"}
                      className={user.isActive ? "bg-green-500" : ""}
                    >
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(user.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/dashboard/users/edit?id=${user.id}`)
                          }
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDelete(user.id)}
                          disabled={isDeleting === user.id}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {isDeleting === user.id ? "Deleting..." : "Delete"}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No users found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing <strong>{users.length}</strong> of <strong>{totalUsers}</strong> users
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchUsers(currentPage - 1, pageSize, searchQuery)}
            disabled={currentPage <= 1 || loading}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchUsers(currentPage + 1, pageSize, searchQuery)}
            disabled={users.length < pageSize || loading}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}