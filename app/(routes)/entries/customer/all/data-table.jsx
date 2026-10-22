"use client";

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import DataTablePagination from "@/components/DataTablePagination";
import rowsPerPageArray from "@/constants/rowsPerPageArray";
import { formatCurrency, getColumns, getStatusBadgeVariant } from "./columns";
import DataTableToolbar from "@/components/DataTableFilterToolbar";
import { useIsMobile } from "@/hooks/use-mobile";
import formatDate from "@/utils/formatDate";
import ConfirmDialog from "@/components/ConfirmDialog";
import deleteCustomerEntry from "@/features/entries/customer/actions/deleteCustomerEntry";
import { toast } from "sonner";
import {
  Eye,
  Trash2,
  Phone,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Table2,
  SlidersHorizontal,
  Package,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Plus,
  CheckCircle2,
  XCircle,
  MapPin,
  Calendar,
} from "lucide-react";

function getUrl(pathname, searchParams) {
  const queryString = searchParams.toString();
  return queryString ? `${pathname}?${queryString}` : pathname;
}

export function DataTable({ data = [], pagination, filters }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const isMobile = useIsMobile();

  // View mode: 'cards' or 'table'
  // Auto-detect based on screen width on initial mount, but allow user toggle
  const [viewMode, setViewMode] = useState("table");
  const [copiedPhoneId, setCopiedPhoneId] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});

  useEffect(() => {
    if (isMobile) {
      setViewMode("cards");
    } else {
      setViewMode("table");
    }
  }, [isMobile]);

  // Table column visibility state
  const [columnVisibility, setColumnVisibility] = useState({
    address: false,
    entryDate: false,
    totalPurchasePrice: false,
    paidByCustomer: false,
    totalDiscount: false,
    shippingMerchant: false,
    otherCost: false,
    courierTax: false,
    netProfit: false,
  });

  const [rowSelection, setRowSelection] = useState({});

  const paginationState = useMemo(
    () => ({
      pageIndex: Math.max((pagination?.page || 1) - 1, 0),
      pageSize: pagination?.itemsPerPage || 20,
    }),
    [pagination?.page, pagination?.itemsPerPage]
  );

  function updateQuery(updates) {
    const nextSearchParams = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        nextSearchParams.delete(key);
        return;
      }

      if (value === "") {
        if (key === "fromDate" || key === "toDate") {
          nextSearchParams.set(key, "");
        } else {
          nextSearchParams.delete(key);
        }
        return;
      }

      nextSearchParams.set(key, String(value));
    });

    startTransition(() => {
      router.push(getUrl(pathname, nextSearchParams), { scroll: false });
    });
  }

  // Pre-calculate visible totals once
  const visibleTotals = useMemo(() => {
    if (!data || data.length === 0) return {};
    const sumKeys = [
      "totalPurchasePrice",
      "totalSellPrice",
      "paidByCustomer",
      "totalQuantity",
      "totalDiscount",
      "shippingCustomer",
      "shippingMerchant",
      "otherCost",
      "courierTax",
      "netProfit",
    ];
    const totals = {};
    for (let k = 0; k < sumKeys.length; k++) {
      const key = sumKeys[k];
      if (columnVisibility[key] !== false) {
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          sum += data[i][key] || 0;
        }
        totals[key] = sum;
      }
    }
    return totals;
  }, [data, columnVisibility]);

  // Memoized columns using precomputed totals
  const columns = useMemo(() => getColumns(visibleTotals), [visibleTotals]);

  // TanStack Table instance
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    pageCount: pagination?.totalPages || 1,
    rowCount: pagination?.totalEntries || data.length,
    enableSorting: false,
    onPaginationChange: (updater) => {
      const nextPagination =
        typeof updater === "function" ? updater(paginationState) : updater;
      const pageSizeChanged =
        nextPagination.pageSize !== paginationState.pageSize;

      updateQuery({
        page: pageSizeChanged ? 1 : nextPagination.pageIndex + 1,
        itemsPerPage: nextPagination.pageSize,
      });
    },
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      pagination: paginationState,
      columnVisibility,
      rowSelection,
    },
  });

  function copyToClipboard(text, id) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedPhoneId(id);
    toast.success("Mobile number copied to clipboard");
    setTimeout(() => {
      setCopiedPhoneId(null);
    }, 2000);
  }

  function toggleCardExpand(id) {
    setExpandedCards((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  // Quick stats summary
  const summaryStats = useMemo(() => {
    let totalSell = 0;
    let totalProfit = 0;
    let totalQty = 0;
    for (let i = 0; i < data.length; i++) {
      totalSell += data[i].totalSellPrice || 0;
      totalProfit += data[i].netProfit || 0;
      totalQty += data[i].totalQuantity || 0;
    }
    return {
      totalEntries: pagination?.totalEntries || data.length,
      visibleEntries: data.length,
      totalSell,
      totalProfit,
      totalQty,
    };
  }, [data, pagination?.totalEntries]);

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Page Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-foreground">
            All Customer Entries
          </h1>
          <Badge variant="secondary" className="font-semibold text-xs px-2.5 py-0.5">
            {summaryStats.totalEntries} {summaryStats.totalEntries === 1 ? "entry" : "entries"}
          </Badge>
        </div>

        {/* Top Controls: View Switcher & Action buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* View Toggle: Cards vs Table */}
          <div className="flex items-center rounded-lg border bg-muted/40 p-0.5">
            <Button
              type="button"
              variant={viewMode === "cards" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className="h-8 gap-1.5 px-2.5 text-xs font-medium"
              aria-label="Cards view"
            >
              <LayoutGrid className="size-3.5" />
              <span className="hidden xs:inline">Cards</span>
            </Button>
            <Button
              type="button"
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("table")}
              className="h-8 gap-1.5 px-2.5 text-xs font-medium"
              aria-label="Table view"
            >
              <Table2 className="size-3.5" />
              <span className="hidden xs:inline">Table</span>
            </Button>
          </div>

          {/* Columns Visibility Dropdown (Available in both modes) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 px-2.5">
                <SlidersHorizontal className="size-3.5" />
                <span className="hidden sm:inline">Columns</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 max-h-72 overflow-y-auto">
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize text-xs"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(Boolean(value))
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Add Entry Quick Link */}
          <Button size="sm" className="h-8 text-xs gap-1.5 px-3" asChild>
            <a href="/entries/customer/add">
              <Plus className="size-3.5" />
              <span className="hidden sm:inline">Add Entry</span>
            </a>
          </Button>
        </div>
      </div>

      {/* Quick Stats Summary Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        <div className="rounded-xl border bg-card/70 p-3 sm:p-4 shadow-2xs flex flex-col gap-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Page Orders</span>
            <ShoppingBag className="size-4 text-primary" />
          </div>
          <div className="text-lg sm:text-2xl font-bold tracking-tight text-foreground">
            {summaryStats.visibleEntries}
          </div>
          <span className="text-[11px] text-muted-foreground">
            of {summaryStats.totalEntries} total
          </span>
        </div>

        <div className="rounded-xl border bg-card/70 p-3 sm:p-4 shadow-2xs flex flex-col gap-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Page Sell Value</span>
            <DollarSign className="size-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-lg sm:text-2xl font-bold tracking-tight text-foreground font-mono">
            {formatCurrency(summaryStats.totalSell)}
          </div>
          <span className="text-[11px] text-muted-foreground">
            Total revenue on page
          </span>
        </div>

        <div className="rounded-xl border bg-card/70 p-3 sm:p-4 shadow-2xs flex flex-col gap-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Page Net Profit</span>
            <TrendingUp className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div
            className={`text-lg sm:text-2xl font-bold tracking-tight font-mono ${
              summaryStats.totalProfit >= 0
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-destructive"
            }`}
          >
            {formatCurrency(summaryStats.totalProfit)}
          </div>
          <span className="text-[11px] text-muted-foreground">
            Calculated net profit
          </span>
        </div>

        <div className="rounded-xl border bg-card/70 p-3 sm:p-4 shadow-2xs flex flex-col gap-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Items Quantity</span>
            <Package className="size-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="text-lg sm:text-2xl font-bold tracking-tight text-foreground font-mono">
            {summaryStats.totalQty}
          </div>
          <span className="text-[11px] text-muted-foreground">
            Units ordered on page
          </span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <DataTableToolbar
        filters={filters}
        isPending={isPending}
        onApplyFilters={(nextFilters) =>
          updateQuery({ ...nextFilters, page: 1 })
        }
      />

      {/* Main Content: Card View vs Table View */}
      {viewMode === "cards" ? (
        /* ================= CARDS VIEW (Mobile-Optimized) ================= */
        <div className="flex flex-col gap-4">
          {data.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {table.getRowModel().rows.map((row, idx) => {
                const entry = row.original;
                const customer = entry?.customer || {};
                const isSelected = row.getIsSelected();
                const isExpanded = !!expandedCards[entry._id];
                const sl =
                  paginationState.pageIndex * paginationState.pageSize +
                  idx +
                  1;

                return (
                  <Card
                    key={entry._id || idx}
                    className={`transition-all py-0 gap-0 overflow-hidden border shadow-2xs ${
                      isSelected
                        ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                        : "bg-card hover:border-border/80"
                    }`}
                  >
                    {/* Card Header Bar */}
                    <CardHeader className="p-3.5 pb-2.5 flex flex-row items-center justify-between border-b bg-muted/20 gap-2">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(val) =>
                            row.toggleSelected(Boolean(val))
                          }
                          aria-label={`Select entry ${sl}`}
                        />
                        <span className="text-xs font-mono font-medium text-muted-foreground">
                          #{sl}
                        </span>
                        <Badge
                          variant={getStatusBadgeVariant(entry.orderStatus)}
                          className="capitalize text-[11px] font-medium px-2 py-0.5"
                        >
                          {entry.orderStatus || "Pending"}
                        </Badge>
                      </div>

                      {/* Header Actions */}
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-7 text-muted-foreground hover:text-foreground"
                          asChild
                          title="View Details"
                        >
                          <a
                            href={`/entries/customer/view/${entry._id}`}
                            aria-label="View entry"
                          >
                            <Eye className="size-3.5" />
                          </a>
                        </Button>
                        <ConfirmDialog
                          variant="destructive"
                          label="Delete"
                          message="Are you sure you want to delete this customer entry?"
                          onConfirm={async () => {
                            const success = await deleteCustomerEntry(entry._id);
                            if (success) {
                              toast.success("Entry deleted successfully");
                            } else {
                              toast.error("Failed to delete entry");
                            }
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </ConfirmDialog>
                      </div>
                    </CardHeader>

                    {/* Card Body */}
                    <CardContent className="p-3.5 flex flex-col gap-3">
                      {/* Customer Name & Date */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col">
                          <CardTitle className="text-sm font-semibold text-foreground">
                            {customer.name || "Unknown Customer"}
                          </CardTitle>
                          {customer.address ? (
                            <p
                              className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 line-clamp-1"
                              title={customer.address}
                            >
                              <MapPin className="size-3 shrink-0 text-muted-foreground/70" />
                              <span className="truncate">{customer.address}</span>
                            </p>
                          ) : null}
                        </div>

                        {/* Order Date */}
                        <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground whitespace-nowrap shrink-0">
                          <Calendar className="size-3" />
                          {formatDate(entry.orderDate) || "-"}
                        </div>
                      </div>

                      {/* Mobile Number with Call & Copy */}
                      {customer.mobileNumber ? (
                        <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 p-2 text-xs">
                          <a
                            href={`tel:${customer.mobileNumber}`}
                            className="flex items-center gap-1.5 font-mono font-medium text-primary hover:underline"
                          >
                            <Phone className="size-3 text-primary" />
                            {customer.mobileNumber}
                          </a>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-6 text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              copyToClipboard(customer.mobileNumber, entry._id)
                            }
                            title="Copy Phone"
                            aria-label="Copy phone number"
                          >
                            {copiedPhoneId === entry._id ? (
                              <Check className="size-3 text-emerald-600" />
                            ) : (
                              <Copy className="size-3" />
                            )}
                          </Button>
                        </div>
                      ) : null}

                      {/* Financials 2x2 Grid */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t">
                        <div className="flex flex-col">
                          <span className="text-[11px] text-muted-foreground">
                            Sell Price
                          </span>
                          <span className="text-sm font-bold font-mono text-foreground">
                            {formatCurrency(entry.totalSellPrice)}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] text-muted-foreground">
                            Net Profit
                          </span>
                          <span
                            className={`text-sm font-bold font-mono ${
                              (entry.netProfit || 0) >= 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-destructive"
                            }`}
                          >
                            {formatCurrency(entry.netProfit)}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] text-muted-foreground">
                            Paid by Customer
                          </span>
                          <span className="text-xs font-medium font-mono text-muted-foreground">
                            {formatCurrency(entry.paidByCustomer)}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[11px] text-muted-foreground">
                            Total Quantity
                          </span>
                          <span className="text-xs font-medium font-mono text-foreground">
                            {entry.totalQuantity ?? 0} pcs
                          </span>
                        </div>
                      </div>

                      {/* Expandable Section for Detailed Financials & Shipping */}
                      {isExpanded ? (
                        <div className="flex flex-col gap-2 pt-2 border-t text-xs animate-in fade-in-50 duration-150">
                          <div className="grid grid-cols-2 gap-2 text-muted-foreground">
                            <div>
                              <span>Purchase Price:</span>{" "}
                              <strong className="text-foreground font-mono">
                                {formatCurrency(entry.totalPurchasePrice)}
                              </strong>
                            </div>
                            <div>
                              <span>Discount:</span>{" "}
                              <strong className="text-foreground font-mono">
                                {formatCurrency(entry.totalDiscount)}
                              </strong>
                            </div>
                            <div>
                              <span>Customer Ship:</span>{" "}
                              <strong className="text-foreground font-mono">
                                {formatCurrency(entry.shippingCustomer)}
                              </strong>
                            </div>
                            <div>
                              <span>Merchant Ship:</span>{" "}
                              <strong className="text-foreground font-mono">
                                {formatCurrency(entry.shippingMerchant)}
                              </strong>
                            </div>
                            <div>
                              <span>Courier Tax:</span>{" "}
                              <strong className="text-foreground font-mono">
                                {formatCurrency(entry.courierTax)}
                              </strong>
                            </div>
                            <div>
                              <span>Other Cost:</span>{" "}
                              <strong className="text-foreground font-mono">
                                {formatCurrency(entry.otherCost)}
                              </strong>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-[11px]">
                            <div className="flex items-center gap-1.5">
                              <span className="text-muted-foreground">
                                Source:
                              </span>
                              <Badge variant="outline" className="text-[10px]">
                                {entry.entrySource || "Other"}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-muted-foreground">SMS:</span>
                              {entry.message ? (
                                <span className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
                                  <CheckCircle2 className="size-3" /> Sent
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 text-muted-foreground">
                                  <XCircle className="size-3" /> Not Sent
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </CardContent>

                    {/* Card Footer: Expand / Collapse Details Button */}
                    <CardFooter className="px-3.5 py-2 border-t bg-muted/10 flex items-center justify-between">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleCardExpand(entry._id)}
                        className="h-7 w-full text-xs text-muted-foreground hover:text-foreground justify-center gap-1"
                      >
                        {isExpanded ? (
                          <>
                            <span>Hide Details</span>
                            <ChevronUp className="size-3.5" />
                          </>
                        ) : (
                          <>
                            <span>More Details</span>
                            <ChevronDown className="size-3.5" />
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 rounded-xl border bg-card text-center gap-3">
              <ShoppingBag className="size-10 text-muted-foreground/50" />
              <div className="flex flex-col gap-1">
                <h3 className="font-semibold text-base text-foreground">
                  No Customer Entries Found
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  No records match your search or filters. Try adjusting your
                  filters or create a new customer entry.
                </p>
              </div>
              <Button size="sm" asChild className="mt-2 text-xs">
                <a href="/entries/customer/add">Add Customer Entry</a>
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* ================= TABLE VIEW (Enhanced Spreadsheet View) ================= */
        <div className="relative w-full rounded-xl border bg-card shadow-2xs overflow-hidden">
          <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/20">
            <Table className="w-full min-w-[900px] border-collapse">
              <TableHeader className="bg-muted/40 sticky top-0 z-10 backdrop-blur-xs">
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="hover:bg-transparent">
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className="h-10 text-xs font-semibold text-foreground px-3 py-2 whitespace-nowrap"
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
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() ? "selected" : undefined}
                      className="hover:bg-muted/40 transition-colors"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell
                          key={cell.id}
                          className="px-3 py-2 text-xs align-middle"
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
                      className="h-32 text-center text-muted-foreground text-sm"
                    >
                      <div className="flex flex-col items-center justify-center gap-2 py-4">
                        <ShoppingBag className="size-8 text-muted-foreground/40" />
                        <span>No customer entries found.</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
              <TableFooter className="bg-muted/50 border-t font-medium">
                {table.getFooterGroups().map((footerGroup) => (
                  <TableRow key={footerGroup.id}>
                    {footerGroup.headers.map((header) => (
                      <TableCell
                        key={header.id}
                        className="px-3 py-2.5 text-xs align-middle"
                      >
                        {flexRender(
                          header.column.columnDef.footer,
                          header.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableFooter>
            </Table>
          </div>
        </div>
      )}

      {/* Pagination Footer */}
      <DataTablePagination table={table} rowsPerPageArray={rowsPerPageArray} />
    </div>
  );
}
