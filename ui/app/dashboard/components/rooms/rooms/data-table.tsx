"use client"

import { ColumnDef, flexRender, getCoreRowModel, useReactTable, getPaginationRowModel } from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Building, Layers, Search, ChevronLeft, ChevronRight } from "lucide-react"
import { usePropertyStore } from "@/lib/store/property"
import { useEffect, useMemo, useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface RoomData {
  id: string | number;
  name: string;
  buildingId?: number;
  building?: {
    id: number;
    name: string;
  };
  occupied: boolean;
  floorNumber: string;
  sizeInSquareMeters?: number;
  purpose?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface DataTableProps<TData extends RoomData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

export function DataTable<TData extends RoomData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const { buildings, fetchBuildings, fetchRooms } = usePropertyStore();
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("all");
  const [selectedFloor, setSelectedFloor] = useState<string>("all");
  
  // Generate floor options based on the specified format
  const floorOptions = useMemo(() => {
    const options = [
      { value: 'all', label: 'All Floors' },
      { value: 'BS3', label: 'Basement 3 (BS3)' },
      { value: 'BS2', label: 'Basement 2 (BS2)' },
      { value: 'BS1', label: 'Basement 1 (BS1)' },
      { value: 'GF', label: 'Ground Floor (GF)' },
      ...Array.from({ length: 10 }, (_, i) => ({
        value: `F${i + 1}`,
        label: `Floor ${i + 1} (F${i + 1})`
      }))
    ];
    return options;
  }, []);

  useEffect(() => {
    fetchBuildings();
    fetchRooms();
  }, [fetchBuildings, fetchRooms]);

  const filteredData = useMemo(() => {
    let filtered = data;
    if (selectedBuildingId !== "all") {
      filtered = filtered.filter(room => room.buildingId === Number(selectedBuildingId));
    }
    if (selectedFloor !== "all") {
      filtered = filtered.filter(room => room.floorNumber === selectedFloor);
    }
    return filtered;
  }, [data, selectedBuildingId, selectedFloor]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 10 } },
  });

  const totalPages = table.getPageCount();
  const currentPage = table.getState().pagination.pageIndex + 1;

  const getPageRange = (): Array<number | string> => {
    if (totalPages <= 1) return [1];
    
    const pages: Array<number | string> = [];
    const maxButtons = 5;
    const half = Math.floor(maxButtons / 2);
    
    // Ensure we're working with numbers
    const current = Number(currentPage) || 1;
    const total = Number(totalPages) || 1;
    
    let start = Math.max(1, current - half);
    const end = Math.min(total, start + maxButtons - 1);
    
    // Adjust start if we don't have enough buttons
    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1);
    }
    
    // Always show first page
    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push('...');
      }
    }
    
    // Add page numbers
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    // Always show last page
    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pageRange = getPageRange();
  const rowCount = table.getFilteredRowModel().rows.length;
  const rowText = rowCount === 1 ? 'room' : 'rooms';

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 rounded-lg shadow-sm border">
        <h2 className="text-lg font-semibold text-gray-900 hidden sm:block">Rooms</h2>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-56">
            <Select
              value={selectedBuildingId}
              onValueChange={setSelectedBuildingId}
            >
              <SelectTrigger className="w-full bg-white">
                <Building className="h-4 w-4 text-gray-400 mr-2" />
                <SelectValue placeholder="Filter by building" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Buildings</SelectItem>
                {buildings.map((building) => (
                  <SelectItem key={building.id} value={building.id.toString()}>
                    <div className="flex items-center gap-2">
                      <Building className="h-4 w-4" />
                      {building.name}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="relative w-full sm:w-48">
            <Select
              value={selectedFloor}
              onValueChange={setSelectedFloor}
            >
              <SelectTrigger className="w-full bg-white">
                <Layers className="h-4 w-4 text-gray-400 mr-2" />
                <SelectValue placeholder="Filter by floor" />
              </SelectTrigger>
              <SelectContent>
                {/* <SelectItem value="all">All Floors</SelectItem> */}
                {floorOptions.map((floor) => (
                  <SelectItem key={floor.value} value={floor.value}>
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4" />
                      {floor.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="hover:bg-transparent">
                {headerGroup.headers.map((header) => (
                  <TableHead 
                    key={header.id}
                    className="font-semibold text-gray-700 uppercase text-xs tracking-wider"
                  >
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
          <TableBody className="bg-white divide-y divide-gray-100">
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-gray-50 transition-colors group"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell 
                      key={cell.id}
                      className="py-3 px-4 text-sm text-gray-700"
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center text-gray-500 py-8"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Search className="h-8 w-8 text-gray-300" />
                    <p className="text-sm font-medium">No rooms found</p>
                    <p className="text-xs text-gray-400">
                      Try adjusting your filters or add a new room
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between px-2 py-3 bg-white rounded-lg border shadow-sm">
        <div className="text-sm text-gray-500 mb-2 sm:mb-0">
          Showing <span className="font-medium">{rowCount}</span> {rowText}
        </div>
        <div className="flex items-center space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="h-8 w-8 p-0 rounded-md"
          >
            <span className="sr-only">Previous page</span>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {pageRange.map((page) => (
            typeof page === 'number' ? (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                className={`h-8 w-8 p-0 rounded-md ${currentPage === page ? 'bg-primary text-primary-foreground' : ''}`}
                onClick={() => table.setPageIndex(page - 1)}
              >
                {page}
              </Button>
            ) : (
              <span key={`ellipsis-${Math.random()}`} className="flex items-center justify-center h-8 w-8 text-gray-400">
                {page}
              </span>
            )
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="h-8 w-8 p-0 rounded-md"
          >
            <span className="sr-only">Next page</span>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}