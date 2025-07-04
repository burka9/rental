"use client"

import { useState, useEffect } from "react"
import { Search, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
} from "@tanstack/react-table"
import * as Select from "@radix-ui/react-select"
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

// Re-export the Select components with proper types
export const SelectRoot = Select.Root
export const SelectTrigger = Select.Trigger
export const SelectValue = Select.Value
export const SelectContent = Select.Content
export const SelectItem = Select.Item

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  onSearch?: (query: string) => void
  loading?: boolean
  searchPlaceholder?: string
  title?: string
  description?: string
  className?: string
  currentPage?: number
  pageSize?: number
  totalItems?: number
  onPageChange?: (page: number) => void
  onPageSizeChange?: (size: number) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  onSearch,
  loading = false,
  searchPlaceholder = "Search...",
  title,
  description,
  className,
  currentPage = 0,
  pageSize = 10,
  totalItems = 0,
  onPageChange,
  onPageSizeChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [searchValue, setSearchValue] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  
  // Debounce search
  useEffect(() => {
    if (!onSearch) return
    
    const timer = setTimeout(() => {
      onSearch(searchValue)
      setIsSearching(false)
    }, 500)
    
    return () => clearTimeout(timer)
  }, [searchValue, onSearch])
  
  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter: searchValue,
      pagination: {
        pageIndex: currentPage,
        pageSize,
      },
    },
    pageCount: Math.ceil(totalItems / pageSize),
    manualPagination: true,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setSearchValue,
    globalFilterFn: 'includesString',
  })

  return (
    <Card className={cn("overflow-hidden", className)}>
      {(title || description || onSearch) && (
        <CardHeader className="border-b bg-muted/10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1.5">
              {title && <CardTitle className="text-xl">{title}</CardTitle>}
              {description && <CardDescription>{description}</CardDescription>}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {onSearch && (
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder={searchPlaceholder}
                    className="w-full pl-9 h-9"
                    value={searchValue}
                    onChange={(e) => {
                      setSearchValue(e.target.value);
                      setIsSearching(true);
                    }}
                  />
                </div>
              )}
              
              <div className="flex items-center gap-2">
                <SelectRoot
                  value={`${pageSize}`}
                  onValueChange={(value: string) => {
                    const newSize = Number(value);
                    if (onPageSizeChange) {
                      onPageSizeChange(newSize);
                    }
                  }}
                >
                  <SelectTrigger className="h-9 w-[70px] flex items-center justify-between px-3 border rounded-md text-sm font-medium">
                    <SelectValue>{pageSize}</SelectValue>
                    <ChevronDown className="h-4 w-4 opacity-70" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border rounded-md shadow-lg p-1.5 w-[--radix-select-trigger-width]">
                    {[10, 20, 30, 40, 50].map((pageSize) => (
                      <SelectItem 
                        key={pageSize} 
                        value={`${pageSize}`}
                        className="flex items-center px-3 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer outline-none focus:bg-accent focus:text-accent-foreground"
                      >
                        <Select.ItemText className="flex-1">{pageSize} per page</Select.ItemText>
                        <Select.ItemIndicator className="ml-2">
                          <Check className="h-4 w-4 text-primary" />
                        </Select.ItemIndicator>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </SelectRoot>
              </div>
            </div>
          </div>
        </CardHeader>
      )}
      
      <CardContent className="p-0">
        <div className="rounded-lg overflow-hidden border">
          <Table>
            <TableHeader className="bg-muted/30">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="hover:bg-transparent">
                  {headerGroup.headers.map((header) => (
                    <TableHead 
                      key={header.id}
                      className={cn(
                        "font-semibold text-foreground",
                        header.column.getCanSort() && "cursor-pointer select-none"
                      )}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center gap-2">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {header.column.getCanSort() && (
                          <span className="text-muted-foreground">
                            {{
                              asc: '↑',
                              desc: '↓',
                            }[header.column.getIsSorted() as string] ?? '↕'}
                          </span>
                        )}
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            
            <TableBody>
              {loading ? (
                // Loading skeleton
                <tr className="h-16">
                  {Array(columns.length).fill(0).map((_, i) => (
                    <td key={i} className="p-4">
                      <Skeleton className="h-4 w-full rounded" />
                    </td>
                  ))}
                </tr>
              ) : table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <tr key={row.id} className="border-t hover:bg-muted/30">
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="p-4">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr className="h-24 text-center">
                  <td colSpan={columns.length} className="text-muted-foreground">
                    {isSearching ? 'Searching...' : 'No results found'}
                  </td>
                </tr>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      <CardFooter className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t">
          <div className="text-sm text-muted-foreground">
            Showing <span className="font-medium">
              {data.length > 0 ? (currentPage * pageSize) + 1 : 0} -{' '}
              {Math.min((currentPage + 1) * pageSize, totalItems)}
            </span> of{' '}
            <span className="font-medium">{totalItems}</span> results
          </div>
        
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(0)}
              disabled={currentPage === 0 || loading}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(currentPage - 1)}
              disabled={currentPage === 0 || loading}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center justify-center text-sm font-medium w-8">
              {currentPage + 1}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(currentPage + 1)}
              disabled={currentPage >= Math.ceil(totalItems / pageSize) - 1 || loading}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange?.(Math.ceil(totalItems / pageSize) - 1)}
              disabled={currentPage >= Math.ceil(totalItems / pageSize) - 1 || loading}
              className="h-8 w-8 p-0"
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
            <span>Page</span>
            <span className="font-medium">{currentPage + 1}</span>
            <span>of</span>
            <span className="font-medium">{Math.ceil(totalItems / pageSize) || 1}</span>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}
