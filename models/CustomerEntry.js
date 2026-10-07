import { ORDER_STATUSES } from "@/constants/orderStatuses";
import { SHIPPING_METHODS } from "@/constants/shippingMethods";
import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  quantity: { type: Number, default: 1 },
  purchasePrice: { type: Number, default: 0 },
  sellPrice: { type: Number, default: 0 },
  discount: { type: Number, default: 0, default: 0 },
  subtotal: { type: Number, default: 0 }, // calculated field
});

const customerEntrySchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, default: "" },
    cnNumber: { type: String, default: "" },
    orderStatus: {
      type: String,
      enum: ORDER_STATUSES,
      default: ORDER_STATUSES[0],
    },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    orderDate: { type: Date, required: true },
    entryDate: { type: Date, required: true },
    paymentDate: { type: Date },
    products: [productSchema],
    shippingCustomer: { type: Number, default: 0 },
    shippingMerchant: { type: Number, default: 0 },
    shippingMethod: {
      type: String,
      enum: SHIPPING_METHODS,
      default: "Steadfast",
    },
    otherCost: Number,
    courierTax: { type: Number, default: 0 },
    overallDiscount: { type: Number, default: 0 },
    note: { type: String, default: "" },

    // Calculated fields (write-once at submission)
    subtotal: { type: Number, default: 0 },
    paidByCustomer: { type: Number, default: 0 },
    totalShippingCharge: { type: Number, default: 0 },
    totalQuantity: { type: Number, default: 0 },
    totalPurchasePrice: { type: Number, default: 0 },
    totalSellPrice: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    totalIncome: { type: Number, default: 0 },
    netProfit: { type: Number, default: 0 },
    message: { type: String, default: "" },
  },
  {
    collection: "Customer Entries",
  }
);

customerEntrySchema.pre("save", function (next) {
  this.products.forEach((product) => {
    product.subtotal = product.quantity * product.sellPrice - product.discount;
  });
  this.subtotal = this.products.reduce(
    (sum, product) => sum + (product.subtotal || 0),
    0
  );
  this.paidByCustomer =
    this.subtotal + this.shippingCustomer - this.overallDiscount;
  this.totalShippingCharge = this.shippingCustomer + this.shippingMerchant;
  this.totalQuantity = this.products.reduce(
    (sum, product) => sum + (product.quantity || 0),
    0
  );
  this.totalPurchasePrice = this.products.reduce(
    (sum, product) => sum + (product.quantity * product.purchasePrice || 0),
    0
  );
  this.totalSellPrice = this.products.reduce(
    (sum, product) => sum + (product.quantity * product.sellPrice || 0),
    0
  );
  this.totalDiscount =
    this.products.reduce(
      (sum, product) => sum + (product.discount || 0),
      0
    ) + this.overallDiscount;
  this.totalIncome =
    this.paidByCustomer -
    this.totalShippingCharge -
    this.courierTax -
    this.otherCost;
  this.netProfit = this.totalIncome - this.totalPurchasePrice;

  next();
});

const CustomerEntry =
  mongoose.models.CustomerEntry ||
  mongoose.model("CustomerEntry", customerEntrySchema);

export default CustomerEntry;
