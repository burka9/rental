"use client"

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
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
import { usePropertyStore } from "@/lib/store/property";
import { useEffect, useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  vacant: boolean
}

export function DataTable<TData extends { buildingId?: number; occupied: boolean }, TValue>({
  columns,
  data,
  vacant,
}: DataTableProps<TData, TValue>) {
  const { buildings, fetchBuildings, fetchRooms } = usePropertyStore();
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  useEffect(() => {
    fetchBuildings();
    fetchRooms();
  }, [fetchBuildings, fetchRooms]);

  const filteredData = useMemo(() => {
    let filtered = data;
    if (selectedBuildingId !== "all") {
      filtered = filtered.filter(room => room.buildingId === Number(selectedBuildingId));
    }
    if (selectedStatus !== "all") {
      const isOccupied = selectedStatus === "occupied";
      filtered = filtered.filter(room => room.occupied === isOccupied);
    }
    return filtered;
  }, [data, selectedBuildingId, selectedStatus]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const totalPages = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex + 1;
  const maxPagesToShow = 5;

  const getPageRange = () => {
    const half = Math.floor(maxPagesToShow / 2);
    let start = Math.max(1, currentPage - half);
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
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label htmlFor="building-filter" className="text-sm font-medium">
            Filter by Building:
          </label>
          <Select
            value={selectedBuildingId}
            onValueChange={setSelectedBuildingId}
          >
            <SelectTrigger id="building-filter" className="w-[200px]">
              <SelectValue placeholder="All Buildings" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Buildings</SelectItem>
              {buildings.map((building) => (
                <SelectItem key={building.id} value={building.id.toString()}>
                  {building.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <label htmlFor="status-filter" className="text-sm font-medium">
            Filter by Status:
          </label>
          <Select
            value={selectedStatus}
            defaultValue={vacant ? "non-occupied" : "occupied"}
            onValueChange={setSelectedStatus}
          >
            <SelectTrigger id="status-filter" className="w-[200px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
              <SelectItem value="non-occupied">Non-Occupied</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
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
      <div className="flex items-center justify-between space-x-2 py-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="bg-slate-800 text-white hover:bg-slate-800 hover:text-white"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          {pageRange.map((page, index) => (
            <Button
              key={index}
              variant={page === currentPage ? "default" : "outline"}
              size="sm"
              onClick={() => typeof page === "number" && table.setPageIndex(page - 1)}
              disabled={typeof page !== "number"}
              className={typeof page !== "number" ? "cursor-default" : ""}
            >
              {page}
            </Button>
          ))}
          <Button
            variant="outline"
            className="bg-slate-800 text-white hover:bg-slate-800 hover:text-white"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
        <span className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </span>
      </div>
    </div>
  );
}