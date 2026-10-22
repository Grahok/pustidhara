"use client";

import { Eye, Trash2, Phone, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import formatDate from "@/utils/formatDate";
import ConfirmDialog from "@/components/ConfirmDialog";
import DataTableColumnHeader from "@/components/DataTableColumnHeader";
import { toast } from "sonner";
import deleteCustomerEntry from "@/features/entries/customer/actions/deleteCustomerEntry";

export function formatCurrency(amount) {
  if (amount === undefined || amount === null || isNaN(amount)) return "৳0";
  return `৳${Number(amount).toLocaleString()}`;
}

export function getStatusBadgeVariant(status) {
  switch (status?.toLowerCase()) {
    case "delivered":
      return "success";
    case "confirmed":
      return "info";
    case "shipped":
      return "default";
    case "pending":
    case "on hold":
      return "warning";
    case "cancelled":
      return "destructive";
    default:
      return "secondary";
  }
}

export const getColumns = (totals = {}) => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all rows"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select customer entry"
        className="translate-y-[2px]"
      />
    ),
    enableHiding: false,
  },
  {
    accessorKey: "sl",
    header: "SL",
    cell: ({ table, row }) => {
      const pageIndex = table.getState().pagination.pageIndex;
      const pageSize = table.getState().pagination.pageSize;
      const pageRows = table.getRowModel().rows;
      const rowIndex = pageRows.findIndex((r) => r.id === row.id);
      return (
        <span className="font-mono text-xs text-muted-foreground">
          {pageIndex * pageSize + rowIndex + 1}
        </span>
      );
    },
    enableHiding: false,
    footer: () => <span className="font-semibold text-foreground">Total</span>,
  },
  {
    id: "actions",
    header: () => <div className="text-center font-medium">Actions</div>,
    cell: ({ row }) => {
      const entry = row.original;

      return (
        <div className="flex items-center justify-center gap-1.5">
          <Button
            size="icon"
            variant="outline"
            className="size-7 hover:bg-primary/10 hover:text-primary transition-colors"
            asChild
            title="View Details"
          >
            <a href={`/entries/customer/view/${entry._id}`} aria-label="View entry details">
              <Eye className="size-3.5" />
            </a>
          </Button>
          <ConfirmDialog
            variant="destructive"
            label="Delete"
            message="Are you sure you want to delete this customer entry? This action cannot be undone."
            onConfirm={async () => {
              const success = await deleteCustomerEntry(entry._id);
              if (success) {
                toast.success("Customer Entry deleted successfully");
              } else {
                toast.error("Failed to delete customer entry");
              }
            }}
          >
            <Trash2 className="size-3.5" />
          </ConfirmDialog>
        </div>
      );
    },
  },
  {
    accessorKey: "orderStatus",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue("orderStatus") || "Pending";
      return (
        <Badge variant={getStatusBadgeVariant(status)} className="capitalize font-medium">
          {status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "orderDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Order Date" />
    ),
    cell: ({ row }) => {
      const orderDate = row.getValue("orderDate");
      return (
        <span className="font-mono text-xs whitespace-nowrap">
          {formatDate(orderDate) || "-"}
        </span>
      );
    },
    filterFn: "dateRange",
    enableColumnFilter: true,
  },
  {
    accessorKey: "entryDate",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Entry Date" />
    ),
    cell: ({ row }) => {
      const entryDate = row.getValue("entryDate");
      return (
        <span className="font-mono text-xs whitespace-nowrap text-muted-foreground">
          {formatDate(entryDate) || "-"}
        </span>
      );
    },
  },
  {
    accessorKey: "customer.name",
    id: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer Name" />
    ),
    cell: ({ row }) => {
      const name = row.original?.customer?.name || "N/A";
      return (
        <span className="font-medium text-foreground max-w-[160px] truncate block" title={name}>
          {name}
        </span>
      );
    },
  },
  {
    accessorKey: "customer.mobileNumber",
    id: "mobileNumber",
    header: "Mobile Number",
    cell: ({ row }) => {
      const phone = row.original?.customer?.mobileNumber;
      if (!phone) return <span className="text-muted-foreground">-</span>;
      return (
        <a
          href={`tel:${phone}`}
          className="inline-flex items-center gap-1 font-mono text-xs text-primary hover:underline"
        >
          <Phone className="size-3" />
          {phone}
        </a>
      );
    },
  },
  {
    accessorKey: "customer.address",
    id: "address",
    header: "Address",
    cell: ({ row }) => {
      const address = row.original?.customer?.address || "-";
      return (
        <span className="max-w-[200px] truncate block text-muted-foreground text-xs" title={address}>
          {address}
        </span>
      );
    },
  },
  {
    accessorKey: "totalSellPrice",
    header: "Sell Price",
    cell: ({ row }) => (
      <span className="font-mono text-xs font-semibold tabular-nums">
        {formatCurrency(row.getValue("totalSellPrice"))}
      </span>
    ),
    footer: () => (
      <span className="font-mono text-xs font-bold tabular-nums">
        {formatCurrency(totals.totalSellPrice)}
      </span>
    ),
  },
  {
    accessorKey: "netProfit",
    header: "Profit",
    cell: ({ row }) => {
      const val = row.getValue("netProfit");
      const isPositive = (val || 0) >= 0;
      return (
        <span
          className={`font-mono text-xs font-semibold tabular-nums ${
            isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-destructive"
          }`}
        >
          {formatCurrency(val)}
        </span>
      );
    },
    footer: () => (
      <span
        className={`font-mono text-xs font-bold tabular-nums ${
          (totals.netProfit || 0) >= 0
            ? "text-emerald-600 dark:text-emerald-400"
            : "text-destructive"
        }`}
      >
        {formatCurrency(totals.netProfit)}
      </span>
    ),
  },
  {
    accessorKey: "paidByCustomer",
    header: "Paid",
    cell: ({ row }) => (
      <span className="font-mono text-xs tabular-nums text-muted-foreground">
        {formatCurrency(row.getValue("paidByCustomer"))}
      </span>
    ),
    footer: () => (
      <span className="font-mono text-xs font-semibold tabular-nums">
        {formatCurrency(totals.paidByCustomer)}
      </span>
    ),
  },
  {
    accessorKey: "totalQuantity",
    header: "Qty",
    cell: ({ row }) => (
      <span className="font-mono text-xs tabular-nums">
        {row.getValue("totalQuantity") ?? 0}
      </span>
    ),
    footer: () => (
      <span className="font-mono text-xs font-semibold tabular-nums">
        {totals.totalQuantity || 0}
      </span>
    ),
  },
  {
    accessorKey: "totalPurchasePrice",
    header: "Purchase Price",
    cell: ({ row }) => (
      <span className="font-mono text-xs tabular-nums text-muted-foreground">
        {formatCurrency(row.getValue("totalPurchasePrice"))}
      </span>
    ),
    footer: () => (
      <span className="font-mono text-xs font-semibold tabular-nums">
        {formatCurrency(totals.totalPurchasePrice)}
      </span>
    ),
  },
  {
    accessorKey: "totalDiscount",
    header: "Discount",
    cell: ({ row }) => (
      <span className="font-mono text-xs tabular-nums text-muted-foreground">
        {formatCurrency(row.getValue("totalDiscount"))}
      </span>
    ),
    footer: () => (
      <span className="font-mono text-xs font-semibold tabular-nums">
        {formatCurrency(totals.totalDiscount)}
      </span>
    ),
  },
  {
    accessorKey: "shippingCustomer",
    header: "Customer Shipping",
    cell: ({ row }) => (
      <span className="font-mono text-xs tabular-nums text-muted-foreground">
        {formatCurrency(row.getValue("shippingCustomer"))}
      </span>
    ),
    footer: () => (
      <span className="font-mono text-xs font-semibold tabular-nums">
        {formatCurrency(totals.shippingCustomer)}
      </span>
    ),
  },
  {
    accessorKey: "shippingMerchant",
    header: "Merchant Shipping",
    cell: ({ row }) => (
      <span className="font-mono text-xs tabular-nums text-muted-foreground">
        {formatCurrency(row.getValue("shippingMerchant"))}
      </span>
    ),
    footer: () => (
      <span className="font-mono text-xs font-semibold tabular-nums">
        {formatCurrency(totals.shippingMerchant)}
      </span>
    ),
  },
  {
    accessorKey: "otherCost",
    header: "Other Cost",
    cell: ({ row }) => (
      <span className="font-mono text-xs tabular-nums text-muted-foreground">
        {formatCurrency(row.getValue("otherCost"))}
      </span>
    ),
    footer: () => (
      <span className="font-mono text-xs font-semibold tabular-nums">
        {formatCurrency(totals.otherCost)}
      </span>
    ),
  },
  {
    accessorKey: "courierTax",
    header: "Courier Tax",
    cell: ({ row }) => (
      <span className="font-mono text-xs tabular-nums text-muted-foreground">
        {formatCurrency(row.getValue("courierTax"))}
      </span>
    ),
    footer: () => (
      <span className="font-mono text-xs font-semibold tabular-nums">
        {formatCurrency(totals.courierTax)}
      </span>
    ),
  },
  {
    accessorKey: "shippingMethod",
    header: "Shipping Method",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground capitalize">
        {row.getValue("shippingMethod") || "Regular"}
      </span>
    ),
  },
  {
    accessorKey: "entrySource",
    header: "Source",
    cell: ({ row }) => {
      const source = row.getValue("entrySource") || "Other";
      return (
        <Badge variant="outline" className="text-[11px] font-normal">
          {source}
        </Badge>
      );
    },
  },
  {
    accessorKey: "smsSent",
    header: "SMS",
    cell: ({ row }) => {
      const data = row.original;
      const isSent = !!data.message;
      return isSent ? (
        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="size-3" />
          Sent
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
          <XCircle className="size-3" />
          No
        </span>
      );
    },
  },
];
