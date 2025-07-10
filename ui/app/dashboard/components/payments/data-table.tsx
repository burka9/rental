/* eslint-disable react-hooks/exhaustive-deps */
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
import { DateRange } from "react-day-picker"
import { format, subDays } from "date-fns"
import { DateRangePicker } from "@/components/ui/date-range-picker"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  totalItems: number
  pageSize: number
  currentPage: number
}

export function DataTable<TData extends { id: number; name: string; phone?: string; isVerified?: boolean }, TValue>({
  columns,
  data,
  totalItems,
  pageSize,
  currentPage,
}: DataTableProps<TData, TValue>) {
  const [globalFilter, setGlobalFilter] = useState("")
  const [verifiedFilter, setVerifiedFilter] = useState<string>("all")
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 7),
    to: new Date(),
  })
  const [localPage, setLocalPage] = useState(currentPage)
  const { fetchPayments } = useTenantStore()

  const totalPages = Math.ceil(totalItems / pageSize)

  // Debounced fetch function
  const debouncedFetchPayments = useCallback(
    debounce((page: number, search: string, isVerified: string, startDate?: string, endDate?: string) => {
      fetchPayments(page, pageSize, search, isVerified, startDate, endDate)
    }, 300),
    [fetchPayments, pageSize]
  )

  // Handle all fetch triggers in one place
  const handleFetch = useCallback((page: number, search: string, isVerified: string, range?: DateRange) => {
    setLocalPage(page)
    
    // Format dates for API
    const startDate = range?.from ? format(range.from, 'yyyy-MM-dd') : ''
    const endDate = range?.to ? format(range.to, 'yyyy-MM-dd') : ''
    
    debouncedFetchPayments(page, search, isVerified, startDate, endDate)
  }, [debouncedFetchPayments])

  // Handle date range change with proper type safety
  const handleDateRangeChange = (range: DateRange | undefined) => {
    // Ensure we're only handling DateRange objects, not form events
    if (range && 'from' in range) {
      setDateRange(range)
      handleFetch(1, globalFilter, verifiedFilter, range)
    }
  }

  // Initial fetch with default date range
  useEffect(() => {
    // Use the default date range for initial fetch
    const defaultRange = {
      from: subDays(new Date(), 7),
      to: new Date(),
    }
    setDateRange(defaultRange)
    handleFetch(localPage, globalFilter, verifiedFilter, defaultRange)
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
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search by reference number..."
            value={globalFilter}
            onChange={(e) => {
              setGlobalFilter(e.target.value)
              handleFetch(1, e.target.value, verifiedFilter, dateRange) // Reset to page 1 on search
            }}
            className="max-w-sm"
          />
          <Select
            value={verifiedFilter}
            onValueChange={(value) => {
              setVerifiedFilter(value)
              handleFetch(1, globalFilter, value, dateRange) // Reset to page 1 on filter change
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by verification" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="true">Verified</SelectItem>
              <SelectItem value="false">Non-Verified</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="w-[250px]">
            <DateRangePicker
              value={dateRange}
              onChange={(range) => handleDateRangeChange(range as DateRange | undefined)}
            />
          </div>
          {dateRange && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDateRange(undefined)
                handleFetch(1, globalFilter, verifiedFilter, undefined)
              }}
            >
              Clear Dates
            </Button>
          )}
        </div>
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
          onClick={() => handleFetch(Math.max(localPage - 1, 1), globalFilter, verifiedFilter, dateRange)}
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
          onClick={() => handleFetch(Math.min(localPage + 1, totalPages), globalFilter, verifiedFilter, dateRange)}
          disabled={localPage === totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  )
}