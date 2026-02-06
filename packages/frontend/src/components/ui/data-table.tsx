"use client"

import * as React from "react"
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ChevronDown, ChevronUp } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  searchPlaceholder?: string
  searchKeys?: string[]
  pageSize?: number
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Filtrar por nome ou tag...",
  searchKeys = ["name", "tag"],
  pageSize = 10,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = React.useState("")
  const [isMobile, setIsMobile] = React.useState(false)

  // Detecta se está em mobile
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640) // sm breakpoint
    }
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: (row, columnId, filterValue) => {
      const searchValue = filterValue.toLowerCase()
      return searchKeys.some((key) => {
        const value = (row.original as any)[key]
        return value?.toString().toLowerCase().includes(searchValue)
      })
    },
    initialState: {
      pagination: {
        pageSize: pageSize,
      },
    },
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
  })

  // Renderiza cards para mobile
  if (isMobile) {
    return (
      <div className="space-y-4">
      <div className="flex items-center py-2">
        <div className="relative flex-1 max-w-full">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(String(event.target.value))}
            className="pl-8 h-8 text-xs"
          />
        </div>
      </div>
        <div className="space-y-2">
          {table.getRowModel().rows?.length ? (
            <>
              {table.getRowModel().rows.map((row) => {
                const rowData = row.original as any
                const expanded = row.getIsExpanded()
                const rank = row.index + 1
                const pageIndex = table.getState().pagination.pageIndex
                const pageSize = table.getState().pagination.pageSize
                const actualRank = pageIndex * pageSize + rank
                
                return (
                  <Card key={row.id} className="border-2">
                    <CardContent className="p-2.5">
                      <div
                        className="cursor-pointer"
                        onClick={() => row.toggleExpanded()}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-5 w-5 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                row.toggleExpanded()
                              }}
                            >
                              {expanded ? (
                                <ChevronUp className="h-3.5 w-3.5" />
                              ) : (
                                <ChevronDown className="h-3.5 w-3.5" />
                              )}
                            </Button>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-muted-foreground font-semibold w-5">#{actualRank}</span>
                              <div className="flex flex-col">
                                <div className="font-medium text-sm leading-tight">{rowData.name || "N/A"}</div>
                                {rowData.tag && (
                                  <div className="text-[10px] text-muted-foreground font-mono leading-tight">{rowData.tag}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-x-2 gap-y-1.5">
                          {row.getVisibleCells().map((cell) => {
                            // Pula a coluna de rank e name (já mostrados acima)
                            if (cell.column.id === "rank" || cell.column.id === "name") {
                              return null
                            }
                            
                            // Extrai o título do header
                            let headerText = cell.column.id
                            const headerDef = cell.column.columnDef.header
                            if (typeof headerDef === "function") {
                              try {
                                const headerElement = headerDef({ column: cell.column } as any)
                                if (headerElement?.props?.title) {
                                  headerText = headerElement.props.title
                                } else if (headerElement?.props?.children) {
                                  headerText = headerElement.props.children
                                }
                              } catch {
                                // Se falhar, usa o ID da coluna
                              }
                            } else if (headerDef) {
                              headerText = headerDef.toString()
                            }
                            
                            return (
                              <div key={cell.id} className="flex flex-col min-w-0">
                                <span className="text-muted-foreground font-medium text-[10px] mb-0.5 truncate">{headerText}</span>
                                <div className="flex items-start gap-1 min-w-0 overflow-hidden">
                                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      {/* Conteúdo expandido */}
                      {expanded && rowData.renderExpandedContent && (
                        <div className="mt-2 pt-2 border-t">
                          {rowData.renderExpandedContent(rowData)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </>
          ) : (
            <Card className="border-2">
              <CardContent className="p-4 text-center">
                <p className="text-xs text-muted-foreground">Nenhum resultado.</p>
              </CardContent>
            </Card>
          )}
        </div>
        {/* Paginação */}
        <div className="flex flex-col items-center justify-between gap-1.5 px-2 pt-2">
          <div className="text-[10px] text-muted-foreground">
            {table.getFilteredRowModel().rows.length} membro(s) total
          </div>
          <div className="flex items-center space-x-1.5">
            <Button
              variant="outline"
              className="h-7 w-7 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Ir para página anterior</span>
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <div className="text-xs font-medium">
              Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
            </div>
            <Button
              variant="outline"
              className="h-7 w-7 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Ir para próxima página</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Renderiza tabela para desktop
  return (
    <div className="space-y-4">
      <div className="flex items-center py-4">
        <div className="relative flex-1 max-w-full sm:max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(String(event.target.value))}
            className="pl-9 text-sm sm:text-base"
          />
        </div>
      </div>
      <div className="overflow-x-auto rounded-md border scrollbar-hide">
        <div className="relative min-h-[300px] sm:min-h-[400px]">
          <Table className="min-w-[600px]">
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
            <>
              {table.getRowModel().rows.map((row) => (
                <>
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    onClick={() => row.toggleExpanded()}
                    className="cursor-pointer hover:bg-muted/50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                  {/* Linha expandida */}
                  {row.getIsExpanded() && (
                    <TableRow>
                      <TableCell colSpan={columns.length} className="p-0 bg-muted/20">
                        {(row.original as any).renderExpandedContent?.(row.original)}
                      </TableCell>
                    </TableRow>
                  )}
                </>
              ))}
              {/* Linhas vazias para manter altura fixa quando há menos de pageSize itens */}
              {table.getRowModel().rows.length < pageSize &&
                Array.from({ length: pageSize - table.getRowModel().rows.length }).map(
                  (_, index) => (
                    <TableRow key={`empty-${index}`}>
                      <TableCell colSpan={columns.length} className="h-12" />
                    </TableRow>
                  )
                )}
            </>
          ) : (
            <>
              <TableRow>
                <TableCell colSpan={columns.length} className="h-12 text-center">
                  Nenhum resultado.
                </TableCell>
              </TableRow>
              {/* Linhas vazias para manter altura fixa quando não há resultados */}
              {Array.from({ length: pageSize - 1 }).map((_, index) => (
                <TableRow key={`empty-no-results-${index}`}>
                  <TableCell colSpan={columns.length} className="h-12" />
                </TableRow>
              ))}
            </>
          )}
        </TableBody>
        </Table>
        </div>
      </div>
      {/* Paginação */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-2">
        <div className="flex-1 text-xs sm:text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} membro(s) total
        </div>
        <div className="flex items-center space-x-2 sm:space-x-6 lg:space-x-8">
          <div className="hidden sm:flex items-center justify-center text-sm font-medium">
            Página {table.getState().pagination.pageIndex + 1} de{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-1 sm:space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Ir para primeira página</span>
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <span className="sr-only">Ir para página anterior</span>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Ir para próxima página</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <span className="sr-only">Ir para última página</span>
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

