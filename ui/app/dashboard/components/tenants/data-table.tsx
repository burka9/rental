"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState, useCallback, useEffect, useMemo } from "react"
import { useTenantStore } from "@/lib/store/tenants"
import { debounce } from "lodash"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  totalItems: number
  pageSize: number
  currentPage: number
}

export function DataTable<TData extends { id: number; name: string; phone?: string; isShareholder?: boolean }, TValue>({
  columns,
  data,
  totalItems,
  pageSize,
  currentPage,
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = useState("")
  const [officeFilter, setOfficeFilter] = useState("")
  const [shareholderFilter, setShareholderFilter] = useState<string>("all")
  const [localPage, setLocalPage] = useState(currentPage)
  const { fetchTenants } = useTenantStore()

  const totalPages = Math.ceil(totalItems / pageSize)

  // Debounced fetch function
  const debouncedFetchTenants = useMemo(() => 
    debounce((page: number, search: string, isShareholder: string, officeNumber: string) => {
      fetchTenants(page, pageSize, search, isShareholder, officeNumber)
    }, 300),
    [fetchTenants, pageSize]
  )

  // Handle all fetch triggers in one place
  const handleFetch = useCallback((page: number, search: string, isShareholder: string, officeNumber: string) => {
    setLocalPage(page)
    debouncedFetchTenants(page, search, isShareholder, officeNumber)
  }, [debouncedFetchTenants])

  // Initial fetch
  useEffect(() => {
    handleFetch(localPage, globalFilter, shareholderFilter, officeFilter)
  }, [handleFetch, localPage, globalFilter, shareholderFilter, officeFilter])

  // Table setup
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  })

  const maxPagesToShow = 5;

  const getPageRange = () => {
    const half = Math.floor(maxPagesToShow / 2);
    let start = Math.max(1, localPage - half);
    const end = Math.min(totalPages, start + maxPagesToShow - 1);

    if (end - start < maxPagesToShow - 1) {
      start = Math.max(1, end - maxPagesToShow + 1);
    }

    const pages: (number | string)[] = [];
    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push("...");
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push("...");
      pages.push(totalPages);
    }

    return pages;
  };

  const pageRange = getPageRange();

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Input
          placeholder="Search by name or phone..."
          value={globalFilter}
          onChange={(e) => {
            setGlobalFilter(e.target.value)
            handleFetch(1, e.target.value, shareholderFilter, officeFilter)
          }}
          className="max-w-sm border-gray-200 rounded-md shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <Input
          placeholder="Search by Office"
          value={officeFilter}
          onChange={(e) => {
            setOfficeFilter(e.target.value)
            handleFetch(1, globalFilter, shareholderFilter, e.target.value)
          }}
          className="max-w-[150px] border-gray-200 rounded-md shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <Select
          value={shareholderFilter}
          onValueChange={(value) => {
            setShareholderFilter(value)
            handleFetch(1, globalFilter, value, officeFilter)
          }}
        >
          <SelectTrigger className="w-[180px] border-gray-200 rounded-md shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            <SelectValue placeholder="Filter by shareholder" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="true">Shareholders</SelectItem>
            <SelectItem value="false">Non-Shareholders</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border border-gray-200 shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-gray-700">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {data.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-gray-600">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFetch(Math.max(localPage - 1, 1), globalFilter, shareholderFilter, officeFilter)}
            disabled={localPage === 1}
            className="bg-slate-800 text-white hover:bg-slate-800 hover:text-white"
          >
            Previous
          </Button>
          {pageRange.map((page, index) => (
            <Button
              key={index}
              variant={page === localPage ? "default" : "outline"}
              size="sm"
              onClick={() => typeof page === "number" && handleFetch(page, globalFilter, shareholderFilter, officeFilter)}
              disabled={typeof page !== "number"}
              className={typeof page !== "number" ? "cursor-default" : ""}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFetch(Math.min(localPage + 1, totalPages), globalFilter, shareholderFilter, officeFilter)}
            disabled={localPage === totalPages}
            className="bg-slate-800 text-white hover:bg-slate-800 hover:text-white"
          >
            Next
          </Button>
        </div>
        <span className="text-sm text-gray-600">
          Page {localPage} of {totalPages}
        </span>
      </div>
    </div>
  )
}