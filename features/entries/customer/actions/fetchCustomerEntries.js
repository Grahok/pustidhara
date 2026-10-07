"use server";

import { connectToDatabase } from "@/lib/mongoose";
import CustomerEntry from "@/models/CustomerEntry";
import Customer from "@/models/Customer";
import Product from "@/models/Product";
import mongooseDocumentToPlainObject from "@/utils/mongooseDocumentToPlainObject";
import { UTCDate } from "@date-fns/utc";

const DEFAULT_ITEMS_PER_PAGE = 20;
const MAX_ITEMS_PER_PAGE = 500;

function getFirstValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function getPositiveInteger(value, fallback) {
  const number = Number.parseInt(getFirstValue(value), 10);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function buildCustomerEntryQuery({
  fromDate,
  toDate,
  search,
  orderStatus,
  entrySource,
} = {}) {
  const query = {};
  const normalizedFromDate = getFirstValue(fromDate);
  const normalizedToDate = getFirstValue(toDate);
  const normalizedSearch = getFirstValue(search)?.trim();
  const normalizedOrderStatus = getFirstValue(orderStatus);
  const normalizedEntrySource = getFirstValue(entrySource);

  if (normalizedFromDate || normalizedToDate) {
    query.orderDate = {};

    if (normalizedFromDate) {
      query.orderDate.$gte = new Date(
        new UTCDate(`${normalizedFromDate}T00:00:00`),
      );
    }

    if (normalizedToDate) {
      query.orderDate.$lte = new Date(
        new UTCDate(`${normalizedToDate}T23:59:59.999`),
      );
    }
  }

  if (normalizedSearch) {
    const searchRegex = escapeRegex(normalizedSearch);

    const matchedCustomers = await Customer.find({
      $or: [
        { name: { $regex: searchRegex, $options: "i" } },
        { mobileNumber: { $regex: searchRegex, $options: "i" } },
        { address: { $regex: searchRegex, $options: "i" } },
      ],
    })
      .select("_id")
      .lean();

    query.customer = { $in: matchedCustomers.map((customer) => customer._id) };
  }

  if (normalizedOrderStatus) {
    query.orderStatus = normalizedOrderStatus;
  }

  if (normalizedEntrySource) {
    query.entrySource = normalizedEntrySource;
  }

  return query;
}

export default async function fetchCustomerEntries() {
  await connectToDatabase();
  const customerEntries = await CustomerEntry.find()
    .populate("customer", "name mobileNumber address")
    .populate("products.product", "name");
  return mongooseDocumentToPlainObject(customerEntries);
}

export async function fetchPaginatedCustomerEntries(options = {}) {
  await connectToDatabase();

  const requestedPage = getPositiveInteger(options.page, 1);
  const itemsPerPage = Math.min(
    getPositiveInteger(options.itemsPerPage, DEFAULT_ITEMS_PER_PAGE),
    MAX_ITEMS_PER_PAGE,
  );
  const query = await buildCustomerEntryQuery(options);
  const totalEntries = await CustomerEntry.countDocuments(query);
  const totalPages = Math.max(1, Math.ceil(totalEntries / itemsPerPage));
  const page = Math.min(requestedPage, totalPages);

  const customerEntries = await CustomerEntry.find(query)
    .populate("customer", "name mobileNumber address")
    .populate("products.product", "name")
    .sort({ orderDate: -1 })
    .skip((page - 1) * itemsPerPage)
    .limit(itemsPerPage)
    .lean();

  return mongooseDocumentToPlainObject({
    entries: customerEntries,
    pagination: {
      page,
      itemsPerPage,
      totalEntries,
      totalPages,
    },
    filters: {
      search: getFirstValue(options.search)?.trim() || "",
      fromDate: getFirstValue(options.fromDate) || "",
      toDate: getFirstValue(options.toDate) || "",
      orderStatus: getFirstValue(options.orderStatus) || "",
      entrySource: getFirstValue(options.entrySource) || "",
    },
  });
}
