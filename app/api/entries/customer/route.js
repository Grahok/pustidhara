import { connectToDatabase } from "@/lib/mongoose";
import { UTCDate } from "@date-fns/utc";
import CustomerEntry from "@/models/CustomerEntry";
import Customer from "@/models/Customer";
import Product from "@/models/Product";

const DEFAULT_ITEMS_PER_PAGE = 20;
const MAX_ITEMS_PER_PAGE = 500;

function getPositiveInteger(value, fallback) {
  const number = parseInt(value, 10);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function getItemsPerPage(value) {
  const itemsPerPage = getPositiveInteger(value, DEFAULT_ITEMS_PER_PAGE);
  return Math.min(itemsPerPage, MAX_ITEMS_PER_PAGE);
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(req) {
  try {
    await connectToDatabase();
    const url = new URL(req.url);
    const fromDate = url.searchParams.get("fromDate");
    const toDate = url.searchParams.get("toDate");
    const search = url.searchParams.get("search")?.trim();
    const orderStatus = url.searchParams.get("orderStatus");
    const entrySource = url.searchParams.get("entrySource");
    const requestedPage = getPositiveInteger(url.searchParams.get("page"), 1);
    const itemsPerPage = getItemsPerPage(url.searchParams.get("itemsPerPage"));

    const startUTC = new UTCDate(`${fromDate}T00:00:00`);
    const endUTC = new UTCDate(`${toDate}T23:59:59.999`);

    const query = {};

    if (fromDate && toDate) {
      query.orderDate = {
        $gte: new Date(startUTC),
        $lte: new Date(endUTC),
      };
    }
    if (search) {
      const searchRegex = escapeRegex(search);

      const matchedCustomers = await Customer.find({
        $or: [
          { name: { $regex: searchRegex, $options: "i" } },
          { mobileNumber: { $regex: searchRegex, $options: "i" } },
          { address: { $regex: searchRegex, $options: "i" } },
        ],
      })
        .select("_id")
        .lean();

      const customerIds = matchedCustomers.map((c) => c._id);

      query.customer = { $in: customerIds };
    }

    if (orderStatus) {
      query.orderStatus = orderStatus;
    }

    if (entrySource) {
      query.entrySource = entrySource;
    }

    // Count total entries matching the query
    const totalEntries = await CustomerEntry.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(totalEntries / itemsPerPage));
    const page = Math.min(requestedPage, totalPages);

    // Fetch paginated entries
    const entries = await CustomerEntry.find(query)
      .populate("customer", "name mobileNumber address")
      .populate("products.product", "name")
      .sort({ orderDate: -1 })
      .skip((page - 1) * itemsPerPage)
      .limit(itemsPerPage)
      .lean();

    return new Response(
      JSON.stringify({
        message: "Fetching Entries Successful",
        entries: entries,
        pagination: {
          page,
          itemsPerPage,
          totalEntries,
          totalPages,
        },
      }),
      {
        status: 200,
        headers: { "Content-type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching entries:", error);
    return new Response(
      JSON.stringify({
        message: "Failed to fetch entries",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-type": "application/json" },
      }
    );
  }
}

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();

    const products = body.products.map((p) => ({
      product: p.product, // Reference to Product model
      quantity: p.quantity,
      purchasePrice: p.purchasePrice,
      sellPrice: p.sellPrice,
      discount: p.discount,
      subtotal: p.subtotal,
    }));

    for await (const p of products) {
      await Product.findByIdAndUpdate(
        p.product,
        {
          $inc: {
            inStock: -p.quantity,
          },
        },
        { new: true }
      );
    }

    const entry = await CustomerEntry.create({ ...body, products });
    return new Response({
      message: "✅ Entry created successfully",
      entry: entry,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        message: "❌ Error creating entry",
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-type": "application/json" },
      }
    );
  }
}
