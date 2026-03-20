"use client";

import * as React from "react";
import * as htmlToImage from "html-to-image";

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
} from "@tanstack/react-table";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  searchPlaceholder?: string;
  searchKeys?: string[];
  pageSize?: number;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  searchPlaceholder = "Filtrar por nome ou tag...",
  searchKeys = ["name", "tag"],
  pageSize = 10,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [isMobile, setIsMobile] = React.useState(false);
  const [isCopied, setIsCopied] = React.useState(false);

  const exportRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

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
      const searchValue = filterValue.toLowerCase();
      return searchKeys.some((key) => {
        const value = (row.original as any)[key];
        return value?.toString().toLowerCase().includes(searchValue);
      });
    },
    initialState: { pagination: { pageSize } },
    state: { sorting, columnFilters, globalFilter },
  });

  const getHeaderTitle = (column: any) => {
    const header = column.columnDef.header;
    if (typeof header === "string") return header;
    if (typeof header === "function") {
      try {
        const renderedHeader = header({ column });
        if (renderedHeader?.props?.title) return renderedHeader.props.title;
      } catch (e) {
      }
    }
    return column.id.replace(/([A-Z])/g, " $1").toUpperCase();
  };

  const copyToClipboard = async () => {
    if (!exportRef.current) return;
    try {
      const blob = await htmlToImage.toBlob(exportRef.current, {
        backgroundColor: "#020617",
        pixelRatio: 3,
        cacheBust: true,
        width: 1200,
      });
      if (!blob) return;

      const isMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        (navigator.maxTouchPoints > 0 && window.innerWidth < 1024);

      if (isMobileDevice) {
        const file = new File([blob], "ranking.png", { type: "image/png" });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: "Ranking" });
          return;
        }
        // Fallback: download direto (Android sem suporte a file share)
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "ranking.png";
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      try {
        const item = new ClipboardItem({ "image/png": blob });
        await navigator.clipboard.write([item]);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      } catch {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "ranking.png";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
    }
  };
  const PaginationControls = () => (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="flex-1 text-sm text-muted-foreground">
        Página {table.getState().pagination.pageIndex + 1} de{" "}
        {table.getPageCount()}
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          className="hidden h-8 w-8 p-0 lg:flex"
          onClick={() => table.setPageIndex(0)}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          className="hidden h-8 w-8 p-0 lg:flex"
          onClick={() => table.setPageIndex(table.getPageCount() - 1)}
          disabled={!table.getCanNextPage()}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  const renderContent = () => {
    if (isMobile) {
      return (
        <div className="space-y-4">
          <div className="flex flex-col w-full gap-2 py-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                value={globalFilter ?? ""}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="pl-8 h-8 text-xs"
              />
            </div>
            <Button variant="outline" onClick={copyToClipboard}>
              {isCopied ? "Copiado!" : "Copiar Tabela"}
            </Button>
          </div>
          <div className="space-y-2">
            {table.getRowModel().rows?.length === 0 ? (
              <Card className="border-2">
                <CardContent className="p-8 text-center text-muted-foreground">
                  Nenhum resultado encontrado
                </CardContent>
              </Card>
            ) : (
              table.getRowModel().rows?.map((row) => {
                const rowData = row.original as any;
                const actualRank = table.getState().pagination.pageIndex * table.getState().pagination.pageSize + (row.index + 1);
                const isExpanded = row.getIsExpanded();

                return (
                  <Card key={row.id} className="border-2">
                    <CardContent className="p-2.5">
                      <div className="cursor-pointer" onClick={() => row.toggleExpanded()}>
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5">
                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                              {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                            </Button>
                            <span className="text-[10px] text-muted-foreground font-semibold">#{actualRank}</span>
                            <span className="font-medium text-sm">{rowData.name}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-1.5">
                          {row.getVisibleCells().filter(c => !["rank", "name"].includes(c.column.id)).map(cell => (
                            <div key={cell.id} className="flex flex-col">
                              <span className="text-[9px] text-muted-foreground uppercase truncate">
                                {getHeaderTitle(cell.column)}
                              </span>
                              <span className="text-xs font-bold">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {isExpanded && rowData.renderExpandedContent && (
                        <div className="mt-2 pt-2 border-t">
                          {rowData.renderExpandedContent(rowData)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
          <PaginationControls />
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between py-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder={searchPlaceholder} value={globalFilter ?? ""} onChange={(e) => setGlobalFilter(e.target.value)} className="pl-9" />
          </div>
          <Button variant="outline" onClick={copyToClipboard}>
            {isCopied ? "Copiado!" : "Copiar Tabela"}
          </Button>
        </div>
        <div className="rounded-md border min-h-[400px]">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id}>
                  {group.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-[400px] text-center text-muted-foreground">
                    Nenhum resultado encontrado
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <React.Fragment key={row.id}>
                    <TableRow onClick={() => row.toggleExpanded()} className="cursor-pointer hover:bg-muted/50">
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
                      ))}
                    </TableRow>
                    {row.getIsExpanded() && (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="bg-muted/20">
                          {(row.original as any).renderExpandedContent?.(row.original)}
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        <PaginationControls />
      </div>
    );
  };

  return (
    <>
      {renderContent()}
      
      {}
      <div style={{ position: "absolute", left: "-9999px", top: 0, pointerEvents: "none" }}>
        <div ref={exportRef} style={{ width: "1200px" }} className="bg-[#020617] p-6 text-white">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((group) => (
                <TableRow key={group.id} className="border-b border-slate-700">
                  {group.headers.map((header) => (
                    <TableHead key={header.id} className="text-slate-400 font-bold uppercase text-[10px]">
                      {getHeaderTitle(header.column)}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.slice(0, 10).map((row) => (
                <TableRow key={row.id} className="border-b border-slate-800">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2 text-sm font-bold text-white">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
}