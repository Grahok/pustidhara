"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ENTRY_SOURCES } from "@/constants/entrySources";
import { ORDER_STATUSES } from "@/constants/orderStatuses";
import {
  Filter,
  Search,
  X,
  RotateCcw,
  Calendar,
  SlidersHorizontal,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function DataTableToolbar({
  filters = {},
  isPending = false,
  onApplyFilters,
}) {
  const [search, setSearch] = useState(filters.search || "");
  const [fromDate, setFromDate] = useState(filters.fromDate || "");
  const [toDate, setToDate] = useState(filters.toDate || "");
  const [entrySource, setEntrySource] = useState(filters.entrySource || "");
  const [orderStatus, setOrderStatus] = useState(filters.orderStatus || "");
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  useEffect(() => {
    setSearch(filters.search || "");
    setFromDate(filters.fromDate || "");
    setToDate(filters.toDate || "");
    setEntrySource(filters.entrySource || "");
    setOrderStatus(filters.orderStatus || "");
  }, [
    filters.search,
    filters.fromDate,
    filters.toDate,
    filters.entrySource,
    filters.orderStatus,
  ]);

  // Count active filters (excluding search)
  const activeFilterCount = [
    fromDate,
    toDate,
    entrySource,
    orderStatus,
  ].filter(Boolean).length;

  function handleSubmit(event) {
    if (event) event.preventDefault();

    onApplyFilters?.({
      search: search.trim(),
      fromDate,
      toDate,
      entrySource,
      orderStatus,
    });
  }

  function handleClear() {
    setSearch("");
    setFromDate("");
    setToDate("");
    setEntrySource("");
    setOrderStatus("");

    onApplyFilters?.({
      search: "",
      fromDate: "",
      toDate: "",
      entrySource: "",
      orderStatus: "",
    });
  }

  function removeFilter(key) {
    const updates = {
      search,
      fromDate,
      toDate,
      entrySource,
      orderStatus,
    };
    updates[key] = "";
    if (key === "search") setSearch("");
    if (key === "fromDate") setFromDate("");
    if (key === "toDate") setToDate("");
    if (key === "entrySource") setEntrySource("");
    if (key === "orderStatus") setOrderStatus("");

    onApplyFilters?.(updates);
  }

  const hasAnyFilter = Boolean(
    search.trim() || fromDate || toDate || entrySource || orderStatus
  );

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
      {/* Top Search & Filter Toggle Bar */}
      <div className="flex items-center gap-2 w-full">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
          <Input
            className="pl-8.5 pr-8 h-9 text-sm w-full bg-background"
            type="search"
            name="search"
            placeholder="Search customer, phone, address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search ? (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                onApplyFilters?.({
                  search: "",
                  fromDate,
                  toDate,
                  entrySource,
                  orderStatus,
                });
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        {/* Filter Drawer Toggle Button (Mobile & Desktop) */}
        <Button
          type="button"
          variant={activeFilterCount > 0 ? "secondary" : "outline"}
          size="sm"
          onClick={() => setIsMobileFiltersOpen((prev) => !prev)}
          className="h-9 gap-1.5 shrink-0 px-2.5 sm:px-3"
          aria-expanded={isMobileFiltersOpen}
          aria-label="Toggle filter options"
        >
          <SlidersHorizontal className="size-3.5" />
          <span className="hidden xs:inline text-xs sm:text-sm">Filters</span>
          {activeFilterCount > 0 ? (
            <Badge
              variant="default"
              className="size-4.5 p-0 flex items-center justify-center text-[10px] rounded-full"
            >
              {activeFilterCount}
            </Badge>
          ) : null}
        </Button>

        <Button
          type="submit"
          size="sm"
          disabled={isPending}
          className="h-9 px-3 shrink-0 text-xs sm:text-sm"
        >
          {isPending ? "Loading..." : "Search"}
        </Button>
      </div>

      {/* Expandable Filter Panel */}
      <Collapsible open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
        <CollapsibleContent className="transition-all animate-in fade-in-50 duration-200">
          <div className="p-3 sm:p-4 rounded-lg border bg-card/60 backdrop-blur-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-1 border-b">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Filter className="size-3.5" /> Filter Parameters
              </span>
              {hasAnyFilter ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClear}
                  className="h-7 text-xs text-muted-foreground hover:text-foreground px-2"
                >
                  <RotateCcw className="size-3 mr-1" />
                  Reset All
                </Button>
              ) : null}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Order Status */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-foreground">
                  Order Status
                </label>
                <Select
                  value={orderStatus || "ALL"}
                  onValueChange={(val) =>
                    setOrderStatus(val === "ALL" ? "" : val)
                  }
                >
                  <SelectTrigger className="h-9 text-xs sm:text-sm w-full bg-background">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    {ORDER_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Entry Source */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-foreground">
                  Entry Source
                </label>
                <Select
                  value={entrySource || "ALL"}
                  onValueChange={(val) =>
                    setEntrySource(val === "ALL" ? "" : val)
                  }
                >
                  <SelectTrigger className="h-9 text-xs sm:text-sm w-full bg-background">
                    <SelectValue placeholder="All Sources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Sources</SelectItem>
                    {ENTRY_SOURCES.map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date From */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1">
                  <Calendar className="size-3 text-muted-foreground" />
                  From Date
                </label>
                <Input
                  type="date"
                  name="fromDate"
                  className="h-9 text-xs sm:text-sm w-full bg-background"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </div>

              {/* Date To */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-foreground flex items-center gap-1">
                  <Calendar className="size-3 text-muted-foreground" />
                  To Date
                </label>
                <Input
                  type="date"
                  name="toDate"
                  className="h-9 text-xs sm:text-sm w-full bg-background"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </div>
            </div>

            {/* Action buttons inside filter panel */}
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="h-8 text-xs px-3"
              >
                Clear
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="h-8 text-xs px-4"
              >
                {isPending ? "Applying..." : "Apply Filters"}
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Active Filter Chips */}
      {hasAnyFilter ? (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-muted-foreground font-medium mr-1">
            Active:
          </span>
          {search ? (
            <Badge
              variant="secondary"
              className="text-[11px] font-normal gap-1 pl-2 pr-1 py-0.5"
            >
              Search: &ldquo;{search}&rdquo;
              <button
                type="button"
                onClick={() => removeFilter("search")}
                className="hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ) : null}
          {orderStatus ? (
            <Badge
              variant="secondary"
              className="text-[11px] font-normal gap-1 pl-2 pr-1 py-0.5"
            >
              Status: {orderStatus}
              <button
                type="button"
                onClick={() => removeFilter("orderStatus")}
                className="hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ) : null}
          {entrySource ? (
            <Badge
              variant="secondary"
              className="text-[11px] font-normal gap-1 pl-2 pr-1 py-0.5"
            >
              Source: {entrySource}
              <button
                type="button"
                onClick={() => removeFilter("entrySource")}
                className="hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ) : null}
          {fromDate ? (
            <Badge
              variant="secondary"
              className="text-[11px] font-normal gap-1 pl-2 pr-1 py-0.5"
            >
              From: {fromDate}
              <button
                type="button"
                onClick={() => removeFilter("fromDate")}
                className="hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ) : null}
          {toDate ? (
            <Badge
              variant="secondary"
              className="text-[11px] font-normal gap-1 pl-2 pr-1 py-0.5"
            >
              To: {toDate}
              <button
                type="button"
                onClick={() => removeFilter("toDate")}
                className="hover:bg-muted-foreground/20 rounded-full p-0.5"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ) : null}
          <button
            type="button"
            onClick={handleClear}
            className="text-[11px] text-muted-foreground hover:text-destructive underline ml-1 cursor-pointer"
          >
            Clear all
          </button>
        </div>
      ) : null}
    </form>
  );
}
