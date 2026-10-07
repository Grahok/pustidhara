"use client";

import { EyeIcon, TrashIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import formatDate from "@/utils/formatDate";
import ConfirmDialog from "@/components/ConfirmDialog";
import DataTableColumnHeader from "@/components/DataTableColumnHeader";
import { toast } from "sonner";
import deleteCustomerEntry from "@/features/entries/customer/actions/deleteCustomerEntry";

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
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select customer"
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
      return pageIndex * pageSize + rowIndex + 1;
    },
    enableHiding: false,
    footer: "Total",
  },
  {
    id: "actions",
    header: () => <div className="text-center">Actions</div>,
    cell: ({ row }) => {
      const entry = row.original;

      return (
        <>
          <div className="flex items-center justify-self-center gap-2">
            <Button
              size="icon"
              className="size-7 bg-blue-600 hover:bg-blue-700"
              asChild
            >
              <a href={`/entries/customer/view/${entry._id}`}>
                <EyeIcon />
              </a>
            </Button>
            <ConfirmDialog
              variant="destructive"
              label="Delete"
              message="Are you sure to delete this entry?"
              onConfirm={async () => {
                const success = await deleteCustomerEntry(entry._id);
                if (success) {
                  toast.warning("Customer Entry deleted successfully");
                } else {
                  toast.error("Failed to delete customer entry");
                }
              }}
            >
              <TrashIcon />
            </ConfirmDialog>
          </div>
        </>
      );
    },
  },
  {
    accessorKey: "orderDate",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Order Date" />;
    },
    cell: ({ row }) => {
      const orderDate = row.getValue("orderDate");
      const formatted = formatDate(orderDate);

      return formatted;
    },
    filterFn: "dateRange", // Custom filter function
    enableColumnFilter: true,
  },
  {
    accessorKey: "entryDate",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Order Date" />;
    },
    cell: ({ row }) => {
      const entryDate = row.getValue("entryDate");
      const formatted = formatDate(entryDate);

      return formatted;
    },
  },
  {
    accessorKey: "customer.name",
    id: "name",
    header: ({ column }) => {
      return <DataTableColumnHeader column={column} title="Name" />;
    },
  },
  {
    accessorKey: "customer.mobileNumber",
    id: "mobileNumber",
    header: "Mobile Number",
  },
  {
    accessorKey: "customer.address",
    id: "address",
    header: "Address",
  },
  {
    accessorKey: "totalPurchasePrice",
    header: "Total Purchase Price",
    footer: () => totals.totalPurchasePrice || 0,
  },
  {
    accessorKey: "totalSellPrice",
    header: "Total Sell Price",
    footer: () => totals.totalSellPrice || 0,
  },
  {
    accessorKey: "paidByCustomer",
    header: "Paid By Customer",
    footer: () => totals.paidByCustomer || 0,
  },
  {
    accessorKey: "totalQuantity",
    header: "Total Quantity",
    footer: () => totals.totalQuantity || 0,
  },
  {
    accessorKey: "totalDiscount",
    header: "Total Discount",
    footer: () => totals.totalDiscount || 0,
  },
  {
    accessorKey: "shippingCustomer",
    header: "Shipping Customer",
    footer: () => totals.shippingCustomer || 0,
  },
  {
    accessorKey: "shippingMerchant",
    header: "Shipping Merchant",
    footer: () => totals.shippingMerchant || 0,
  },
  {
    accessorKey: "otherCost",
    header: "Other Cost",
    footer: () => totals.otherCost || 0,
  },
  {
    accessorKey: "courierTax",
    header: "Courier Tax",
    footer: () => totals.courierTax || 0,
  },
  {
    accessorKey: "netProfit",
    header: "Total Profit",
    footer: () => totals.netProfit || 0,
  },
  {
    accessorKey: "shippingMethod",
    header: "Shipping Method",
  },
  {
    accessorKey: "orderStatus",
    header: "Order Status",
  },
  {
    accessorKey: "entrySource",
    header: "Entry Source",
    cell: ({ row }) => {
      return row.getValue("entrySource") || "Other";
    },
  },
  {
    accessorKey: "smsSent",
    header: "SMS Sent",
    cell: ({ row }) => {
      const data = row.original;
      return data.message ? "YES" : "NO";
    },
  },
];
