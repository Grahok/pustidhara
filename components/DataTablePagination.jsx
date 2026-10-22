"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

import { Button } from "./ui/button";
import { useId } from "react";

export default function DataTablePagination({ table, rowsPerPageArray }) {
  const id = useId();
  const currentPage = table.getState().pagination.pageIndex + 1;
  const pageCount = Math.max(table.getPageCount(), 1);
  const selectedCount = table.getFilteredSelectedRowModel().rows.length;
  const totalRowCount = table.getRowModel().rows.length;

  return (
    <div className="flex flex-col gap-4 py-2 sm:flex-row sm:items-center sm:justify-between px-1">
      {/* Selection info & Mobile rows per page */}
      <div className="flex items-center justify-between gap-4 text-xs sm:text-sm text-muted-foreground">
        <div>
          {selectedCount > 0 ? (
            <span>
              <strong className="text-foreground">{selectedCount}</strong> of{" "}
              {totalRowCount} row(s) selected.
            </span>
          ) : (
            <span>{totalRowCount} row(s) total.</span>
          )}
        </div>

        {/* Rows per page for mobile view */}
        <div className="flex items-center gap-2 sm:hidden">
          <span className="text-xs font-medium text-foreground">Rows:</span>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[68px] text-xs">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {(rowsPerPageArray || [10, 20, 25, 30, 40, 50]).map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`} className="text-xs">
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Desktop Rows per page + Page indicator + Navigation buttons */}
      <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3 sm:gap-6">
        {/* Rows per page on tablet & desktop */}
        <div className="hidden sm:flex items-center gap-2">
          <p className="text-sm font-medium" id={id}>
            Rows per page
          </p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[72px]" aria-labelledby={id}>
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {(rowsPerPageArray || [10, 20, 25, 30, 40, 50]).map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Page X of Y */}
        <div className="text-xs sm:text-sm font-medium text-muted-foreground">
          Page <span className="text-foreground font-semibold">{currentPage}</span> of{" "}
          <span className="text-foreground font-semibold">{pageCount}</span>
        </div>

        {/* Pagination buttons */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
            aria-label="Go to first page"
          >
            <ChevronsLeft className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            aria-label="Go to previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>

          {/* Current Page Badge */}
          <div className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-semibold">
            {currentPage}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            aria-label="Go to next page"
          >
            <ChevronRight className="size-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.setPageIndex(pageCount - 1)}
            disabled={!table.getCanNextPage()}
            aria-label="Go to last page"
          >
            <ChevronsRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
