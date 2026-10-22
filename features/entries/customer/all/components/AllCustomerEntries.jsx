"use client";

import { useEffect, useRef, useState } from "react";
import {
  FaEye,
  FaMagnifyingGlass,
  FaRotateRight,
  FaTrash,
} from "react-icons/fa6";
import {
  LuChevronLeft,
  LuChevronRight,
  LuChevronsLeft,
  LuChevronsRight,
} from "react-icons/lu";
import formatDate from "@/utils/formatDate";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import firstDateOfCurrentMonth from "@/utils/firstDateOfCurrentMonth";
import inputDateFormat from "@/utils/inputDateFormat";
import fetchCustomerEntries from "../../actions/fetchCustomerEntries";
import deleteCustomerEntry from "../../actions/deleteCustomerEntry";
import ConfirmDialog from "@/components/ConfirmDialog";
import { EyeIcon, LoaderPinwheel, TrashIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AllCustomerEntries() {
  const router = useRouter();
  const pathname = usePathname();
  const [entries, setEntries] = useState([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const searchParams = useSearchParams();
  const fromDateParam =
    searchParams.get("fromDate") || inputDateFormat(new Date(Date.now()));
  const toDateParam =
    searchParams.get("toDate") || inputDateFormat(new Date(Date.now()));
  const pageParam = Number(searchParams.get("page")) || 1;
  const itemsPerPageParam = Number(searchParams.get("itemsPerPage")) || 20;
  const [itemsPerPage, setItemsPerPage] = useState(itemsPerPageParam);
  const [isSpinning, setIsSpinning] = useState(false);
  const queryObj = new URLSearchParams({
    ...Object.fromEntries(searchParams.entries()),
    fromDate: fromDateParam,
    toDate: toDateParam,
    itemsPerPage: itemsPerPageParam,
    page: pageParam,
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const response = await fetchCustomerEntries(`?${queryObj.toString()}`);
        const { entries, pagination } = await response.json();
        const { totalEntries, totalPages } = pagination;
        setTotalEntries(totalEntries);
        setTotalPages(totalPages);
        setEntries(entries);
      } catch (error) {
        console.error("Error fetching entries:", error);
      } finally {
        setLoading(false);
      }
    })();
  }, [searchParams]);

  async function handleDelete(entryId) {
    try {
      await deleteCustomerEntry(entryId);
      setEntries((prev) => prev.filter((entry) => entry._id !== entryId));
      console.log("Entry deleted successfully");
    } catch (error) {
      console.error("Error deleting entry:", error);
    }
  }
  const totalProfit = entries.reduce((acc, entry) => {
    return acc + entry.netProfit;
  }, 0);
  const totalDiscount = entries.reduce((acc, entry) => {
    return acc + entry.totalDiscount;
  }, 0);
  const totalShippingCustomer = entries.reduce((acc, entry) => {
    return acc + entry.shippingCustomer;
  }, 0);
  const totalShippingMerchant = entries.reduce((acc, entry) => {
    return acc + entry.shippingMerchant;
  }, 0);
  const totalOtherCost = entries.reduce((acc, entry) => {
    return acc + entry.otherCost;
  }, 0);
  const totalCourierTax = entries.reduce((acc, entry) => {
    return acc + entry.courierTax;
  }, 0);
  const totalPurchasePrice = entries.reduce((acc, entry) => {
    return acc + entry.totalPurchasePrice;
  }, 0);
  const totalSellPrice = entries.reduce((acc, entry) => {
    return acc + entry.totalSellPrice;
  }, 0);
  const totalPaidByCustomer = entries.reduce((acc, entry) => {
    return acc + entry.paidByCustomer;
  }, 0);
  const totalQuantity = entries.reduce((acc, entry) => {
    return acc + entry.totalQuantity;
  }, 0);

  return (
    <section className="w-full flex flex-col gap-3">
      <div className="flex items-center justify-between gap-6">
        <h1 className="text-3xl font-bold">All Customer Entries:</h1>
        <form className="flex items-center gap-3 flex-wrap justify-end">
          <div className="flex items-center md:items-end gap-6 rounded-lg border border-gray-400 px-4 py-2">
            <div className="flex items-center gap-2 w-full md:w-1/2">
              <label
                htmlFor="fromDate"
                className="font-medium text-gray-700 mb-1"
              >
                From:
              </label>
              <input
                className="p-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                type="date"
                name="fromDate"
                id="fromDate"
                defaultValue={fromDateParam}
              />
            </div>
            <div className="flex items-center gap-2 w-full md:w-1/2">
              <label
                htmlFor="toDate"
                className="font-medium text-gray-700 mb-1"
              >
                To:
              </label>
              <input
                className="p-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                type="date"
                name="toDate"
                id="toDate"
                defaultValue={toDateParam}
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 px-3 rounded-md transition w-full md:w-auto"
              >
                Submit
              </button>
              <a
                href="/entries/customer/all"
                className="p-1.5 bg-orange-300 rounded"
              >
                <FaRotateRight
                  className={`${isSpinning && "animate-spin"} size-5`}
                  onClick={() => setIsSpinning(true)}
                />
              </a>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-full flex items-center gap-2 rounded border border-gray-300 focus-within:ring-2 focus-within:ring-blue-500 transition leading-none">
              <input
                type="search"
                name="search"
                id="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="p-1.5 focus:outline-none"
                placeholder="Search..."
              />
              <button
                type="button"
                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer"
              >
                <FaMagnifyingGlass />
              </button>
            </div>
            <div>
              <select
                name="itemsPerPage"
                id="itemsPerPage"
                className="p-2 border rounded text-center"
                value={itemsPerPage}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  setItemsPerPage(value);
                  const newQuery = new URLSearchParams(
                    Object.fromEntries(searchParams.entries())
                  );
                  newQuery.set("itemsPerPage", value);
                  newQuery.set("page", 1);
                  router.push(`${pathname}?${newQuery.toString()}`, {
                    shallow: true,
                  });
                }}
              >
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={150}>150</option>
                <option value={200}>200</option>
              </select>
            </div>
          </div>
        </form>
      </div>
      <Table className="border">
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Actions</TableHead>
            <TableHead>Order Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Mobile Number</TableHead>
            <TableHead>Total Purchase Price</TableHead>
            <TableHead>Total Sell Price</TableHead>
            <TableHead>Paid By Customer</TableHead>
            <TableHead>Total Quantity</TableHead>
            <TableHead>Total Discount</TableHead>
            <TableHead>Shipping Customer</TableHead>
            <TableHead>Shipping Merchant</TableHead>
            <TableHead>Other Cost</TableHead>
            <TableHead>Courier Tax</TableHead>
            <TableHead>Total Profit</TableHead>
            <TableHead>Order Status</TableHead>
            <TableHead>SMS Sent</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && (
            <TableRow>
              <TableCell colSpan={17} className="bg-gray-50">
                <div className="flex justify-center">
                  <LoaderPinwheel
                    className="animate-spin text-blue-400"
                    size={100}
                  />
                </div>
              </TableCell>
            </TableRow>
          )}
          {!loading && !entries.length && (
            <TableRow>
              <TableCell colSpan={17}>No Entries Found</TableCell>
            </TableRow>
          )}
          {entries.map((entry, index) => (
            <TableRow key={entry._id} className="hover:bg-gray-100">
              <TableCell>
                {(pageParam - 1) * itemsPerPageParam + (index + 1)}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button size="icon" className="size-7">
                    <a href={`/entries/customer/view/${entry._id}`}>
                      <EyeIcon />
                    </a>
                  </Button>
                  <ConfirmDialog
                    onConfirm={() => handleDelete(entry._id)}
                    message="Are you sure you want to delete this entry?"
                    label="Delete"
                    variant="destructive"
                    className="cursor-pointer"
                  >
                    <TrashIcon />
                  </ConfirmDialog>
                </div>
              </TableCell>
              <TableCell>{formatDate(entry.orderDate)}</TableCell>
              <TableCell>
                {entry.customer?.name || "Customer Not Found"}
              </TableCell>
              <TableCell>
                {entry.customer?.mobileNumber || "Customer Not Found"}
              </TableCell>
              <TableCell>{entry.totalPurchasePrice}</TableCell>
              <TableCell>{entry.totalSellPrice}</TableCell>
              <TableCell>{entry.paidByCustomer}</TableCell>
              <TableCell>{entry.totalQuantity}</TableCell>
              <TableCell>{entry.totalDiscount}</TableCell>
              <TableCell>{entry.shippingCustomer}</TableCell>
              <TableCell>{entry.shippingMerchant}</TableCell>
              <TableCell>{entry.otherCost}</TableCell>
              <TableCell>{entry.courierTax}</TableCell>
              <TableCell>{entry.netProfit}</TableCell>
              <TableCell>{entry.orderStatus}</TableCell>
              <TableCell>{entry.message ? "YES" : "NO"}</TableCell>
            </TableRow>
          ))}
          <TableRow>
            <TableCell colSpan={5} className="font-bold">
              Total:
            </TableCell>
            <TableHead>{totalPurchasePrice}</TableHead>
            <TableHead>{totalSellPrice}</TableHead>
            <TableHead>{totalPaidByCustomer}</TableHead>
            <TableHead>{totalQuantity}</TableHead>
            <TableHead>{totalDiscount}</TableHead>
            <TableHead>{totalShippingCustomer}</TableHead>
            <TableHead>{totalShippingMerchant}</TableHead>
            <TableHead>{totalOtherCost}</TableHead>
            <TableHead>{totalCourierTax}</TableHead>
            <TableHead>{totalProfit}</TableHead>
            <TableHead>N/A</TableHead>
            <TableHead>N/A</TableHead>
          </TableRow>
        </TableBody>
      </Table>
      <div className="flex justify-between">
        <strong>{`Showing ${Math.min(
          totalEntries,
          itemsPerPageParam
        )} items of ${totalEntries || "Loading..."}`}</strong>
        <div className="flex gap-2 leading-none">
          <button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 p-2 rounded cursor-pointer text-white"
            onClick={() => {
              const newQuery = new URLSearchParams(
                Object.fromEntries(searchParams.entries())
              );
              newQuery.set("page", 1);
              router.push(`${pathname}?${newQuery.toString()}`, {
                shallow: true,
              });
            }}
          >
            <LuChevronsLeft />
          </button>
          <button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 p-2 rounded cursor-pointer text-white"
            onClick={() => {
              const newQuery = new URLSearchParams(
                Object.fromEntries(searchParams.entries())
              );
              newQuery.set("page", Math.max(1, pageParam - 1));
              router.push(`${pathname}?${newQuery.toString()}`, {
                shallow: true,
              });
            }}
          >
            <LuChevronLeft />
          </button>

          {[
            pageParam - 2,
            pageParam - 1,
            pageParam,
            pageParam + 1,
            pageParam + 2,
          ]
            .filter((page) => page > 0 && page <= totalPages)
            .map((page) => (
              <button
                key={page}
                type="button"
                className={`${
                  page === pageParam
                    ? "border-2 border-blue-600"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                } p-2 rounded cursor-pointer`}
                onClick={() => {
                  const newQuery = new URLSearchParams(
                    Object.fromEntries(searchParams.entries())
                  );
                  newQuery.set("page", page);
                  router.push(`${pathname}?${newQuery.toString()}`, {
                    shallow: true,
                  });
                }}
              >
                {page}
              </button>
            ))}

          <button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 p-2 rounded cursor-pointer text-white"
            onClick={() => {
              const newQuery = new URLSearchParams(
                Object.fromEntries(searchParams.entries())
              );
              newQuery.set("page", Math.min(totalPages, pageParam + 1));
              router.push(`${pathname}?${newQuery.toString()}`, {
                shallow: true,
              });
            }}
          >
            <LuChevronRight />
          </button>
          <button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 p-2 rounded cursor-pointer text-white"
            onClick={() => {
              const newQuery = new URLSearchParams(
                Object.fromEntries(searchParams.entries())
              );
              newQuery.set("page", totalPages);
              router.push(`${pathname}?${newQuery.toString()}`, {
                shallow: true,
              });
            }}
          >
            <LuChevronsRight />
          </button>
        </div>
      </div>
    </section>
  );
}
