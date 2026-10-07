export const dynamic = "force-dynamic";

import { fetchPaginatedCustomerEntries } from "@/features/entries/customer/actions/fetchCustomerEntries";
import { DataTable } from "./data-table";

function getSearchParam(searchParams, key) {
  const value = searchParams?.[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function AllCustomers({ searchParams }) {
  const params = await searchParams;
  const { entries, pagination, filters } = await fetchPaginatedCustomerEntries({
    page: getSearchParam(params, "page"),
    itemsPerPage: getSearchParam(params, "itemsPerPage"),
    search: getSearchParam(params, "search"),
    fromDate: getSearchParam(params, "fromDate"),
    toDate: getSearchParam(params, "toDate"),
    orderStatus: getSearchParam(params, "orderStatus"),
    entrySource: getSearchParam(params, "entrySource"),
  });

  return (
    <div className="container mx-auto py-10">
      <DataTable data={entries} pagination={pagination} filters={filters} />
    </div>
  );
}
