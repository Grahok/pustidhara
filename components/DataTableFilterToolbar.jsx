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
import { ENTRY_SOURCES } from "@/constants/entrySources";

export default function DataTableToolbar({
  filters = {},
  isPending = false,
  onApplyFilters,
}) {
  const [search, setSearch] = useState(filters.search || "");
  const [fromDate, setFromDate] = useState(filters.fromDate || "");
  const [toDate, setToDate] = useState(filters.toDate || "");
  const [entrySource, setEntrySource] = useState(filters.entrySource || "");

  useEffect(() => {
    setSearch(filters.search || "");
    setFromDate(filters.fromDate || "");
    setToDate(filters.toDate || "");
    setEntrySource(filters.entrySource || "");
  }, [filters.search, filters.fromDate, filters.toDate, filters.entrySource]);

  function applyFilters(event) {
    event.preventDefault();

    onApplyFilters?.({
      search: search.trim(),
      fromDate,
      toDate,
      entrySource,
      ...(filters.orderStatus ? { orderStatus: filters.orderStatus } : {}),
    });
  }

  function clearFilters() {
    setSearch("");
    setFromDate("");
    setToDate("");
    setEntrySource("");

    onApplyFilters?.({
      search: "",
      fromDate: "",
      toDate: "",
      entrySource: "",
      ...(filters.orderStatus ? { orderStatus: filters.orderStatus } : {}),
    });
  }

  return (
    <form
      className="flex flex-col gap-4 my-4 sm:flex-row sm:items-center"
      onSubmit={applyFilters}
    >
      {/* Global Search */}
      <Input
        className="w-full sm:w-60"
        type="search"
        name="search"
        placeholder="Search name, mobile, address..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* Entry Source Filter */}
      <Select
        value={entrySource || "ALL"}
        onValueChange={(val) => setEntrySource(val === "ALL" ? "" : val)}
      >
        <SelectTrigger className="w-full sm:w-44">
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

      {/* Date Range Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          type="date"
          name="fromDate"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
        />
        <Input
          type="date"
          name="toDate"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Loading..." : "Apply"}
        </Button>
        <Button type="button" variant="outline" onClick={clearFilters}>
          Clear
        </Button>
      </div>
    </form>
  );
}
