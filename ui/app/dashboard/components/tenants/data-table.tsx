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
import { useState, useCallback, useEffect } from "react"
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
  const [shareholderFilter, setShareholderFilter] = useState<string>("all")
  const [localPage, setLocalPage] = useState(currentPage)
  const { fetchTenants } = useTenantStore()

  const totalPages = Math.ceil(totalItems / pageSize)

  // Debounced fetch function
  const debouncedFetchTenants = useCallback(
    debounce((page: number, search: string, isShareholder: string) => {
      fetchTenants(page, pageSize, search, isShareholder)
    }, 300),
    [fetchTenants, pageSize]
  )

  // Handle all fetch triggers in one place
  const handleFetch = useCallback((page: number, search: string, isShareholder: string) => {
    setLocalPage(page)
    debouncedFetchTenants(page, search, isShareholder)
  }, [debouncedFetchTenants])

  // Initial fetch
  useEffect(() => {
    handleFetch(localPage, globalFilter, shareholderFilter)
  }, []) // Empty dependency array for initial load only

  // Table setup
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: totalPages,
  })

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search by name or phone..."
          value={globalFilter}
          onChange={(e) => {
            setGlobalFilter(e.target.value)
            handleFetch(1, e.target.value, shareholderFilter) // Reset to page 1 on search
          }}
          className="max-w-sm"
        />
        <Select
          value={shareholderFilter}
          onValueChange={(value) => {
            setShareholderFilter(value)
            handleFetch(1, globalFilter, value) // Reset to page 1 on filter change
          }}
        >
          <SelectTrigger className="w-[180px]">
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
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleFetch(Math.max(localPage - 1, 1), globalFilter, shareholderFilter)}
          disabled={localPage === 1}
        >
          Previous
        </Button>
        <span>
          Page {localPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleFetch(Math.min(localPage + 1, totalPages), globalFilter, shareholderFilter)}
          disabled={localPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  )
}