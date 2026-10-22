"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SHIPPING_METHODS } from "@/constants/shippingMethods";
import inputDateFormat from "@/utils/inputDateFormat";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  CheckCircle2Icon,
  FileTextIcon,
  Loader2Icon,
  MessageSquareIcon,
  PackageIcon,
  ShoppingCartIcon,
  TrashIcon,
  TruckIcon,
  UserIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import fetchProducts from "@/features/products/actions/fetchProducts";
import createCustomer from "@/features/customers/actions/createCustomer";
import { ORDER_STATUSES } from "@/constants/orderStatuses";
import sendParcelTrackingMessage from "@/features/entries/customer/add/actions/sendParcelTrackingMessage";
import { toast } from "sonner";
import InputDatePicker from "@/components/InputDatePicker";
import createCustomerEntry from "@/features/entries/customer/add/actions/createCustomerEntry";
import useDebounce from "@/hooks/use-debounce";
import fetchCustomers from "@/features/customers/actions/fetchCustomers";
import useEnterNavigation from "@/hooks/use-enter-navigation";
import sendOrderToSteadfast from "@/features/entries/customer/add/actions/sendOrderToSteadfast";
import updateCustomerEntry from "@/features/entries/customer/add/actions/updateCustomerEntry";
import EntryPDF from "@/features/entries/customer/view/components/EntryPDF";
import { ENTRY_SOURCES } from "@/constants/entrySources";
import { cn } from "@/lib/utils";

const customerSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1, "Customer name is required"),
  mobileNumber: z.string().regex(/^01.{9}$/, "Must be an 11-digit mobile number starting with 01"),
  address: z.string().min(1, "Address is required"),
});

const productSchema = z.object({
  _id: z.string(),
  name: z.string(),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  inStock: z.coerce.number(),
  purchasePrice: z.coerce.number().nonnegative(),
  sellPrice: z.coerce.number().nonnegative(),
  discount: z.coerce.number().nonnegative(),
});

const customerEntrySchema = z.object({
  invoiceNumber: z.string().optional(),
  cnNumber: z.string().optional(),
  orderStatus: z.enum(ORDER_STATUSES),
  customer: customerSchema,
  orderDate: z.coerce.date(),
  entryDate: z.coerce.date(),
  paymentDate: z.coerce.date().optional(),

  products: z.array(productSchema).min(1, {
    message: "Add at least one product",
  }),
  shippingCustomer: z.coerce.number().nonnegative(),
  shippingMerchant: z.coerce.number().nonnegative(),
  shippingMethod: z.enum(SHIPPING_METHODS),
  otherCost: z.coerce.number().nonnegative(),
  courierTax: z.coerce.number().nonnegative(),
  overallDiscount: z.coerce.number().nonnegative(),
  note: z.string(),
  message: z.string().optional(),
  entrySource: z.enum(ENTRY_SOURCES),
});

export default function AddCustomerEntryPage() {
  // Using enter-navigation hook
  useEnterNavigation({ autoSubmit: false });

  // State for products, customers, courier data, and loading
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [courierData, setCourierData] = useState({});
  const [isCheckingCourier, setIsCheckingCourier] = useState(false);

  // Fetch customers and products on mount
  useEffect(() => {
    (async () => {
      try {
        const [customersData, productsData] = await Promise.all([
          fetchCustomers(),
          fetchProducts(),
        ]);
        setCustomers(customersData || []);
        setProducts(productsData || []);
      } catch (error) {
        console.error("Failed to load initial data:", error);
      }
    })();
  }, []);

  // Form setup
  const form = useForm({
    resolver: zodResolver(
      customerEntrySchema.extend({
        sendToSteadfast: z.boolean().default(true),
      }),
    ),
    defaultValues: {
      invoiceNumber: "",
      cnNumber: "",
      orderStatus: ORDER_STATUSES[0],
      customer: { name: "", mobileNumber: "", address: "" },
      orderDate: inputDateFormat(new Date()),
      entryDate: inputDateFormat(new Date()),
      paymentDate: undefined,
      products: [],
      shippingCustomer: "",
      shippingMerchant: "",
      shippingMethod: SHIPPING_METHODS[0],
      otherCost: "",
      courierTax: "",
      overallDiscount: "",
      note: "",
      message: "",
      entrySource: ENTRY_SOURCES[ENTRY_SOURCES.length - 1],
      sendToSteadfast: true,
    },
  });

  // Field array for products
  const productFieldArray = useFieldArray({
    control: form.control,
    name: "products",
  });

  // Watchers for form fields
  const watchedProducts = useWatch({ control: form.control, name: "products" }) ?? [];
  const watchedCharges = useWatch({
    control: form.control,
    name: [
      "shippingCustomer",
      "shippingMerchant",
      "otherCost",
      "courierTax",
      "overallDiscount",
    ],
  }) ?? [0, 0, 0, 0, 0];

  const [
    shippingCustomer,
    shippingMerchant,
    otherCost,
    courierTax,
    overallDiscount,
  ] = watchedCharges.map((val) => Number(val) || 0);

  const [
    trackingLink = "",
    customer = { mobileNumber: "", name: "", address: "" },
    orderStatus = ORDER_STATUSES[0],
    shippingMethod = SHIPPING_METHODS[0],
  ] = useWatch({
    control: form.control,
    name: ["message", "customer", "orderStatus", "shippingMethod"],
  }) ?? [];

  // Debounced search for customer mobile number
  const debouncedSearch = useDebounce(customer?.mobileNumber, 500);

  // Fetch courier data and autofill customer if found
  useEffect(() => {
    if (
      debouncedSearch &&
      debouncedSearch.trim() !== "" &&
      customerSchema.shape.mobileNumber.safeParse(debouncedSearch).success
    ) {
      setCourierData({});
      const foundCustomer = customers.find(
        (c) => c.mobileNumber === debouncedSearch,
      );
      form.setValue(
        "customer",
        foundCustomer || {
          name: "",
          mobileNumber: debouncedSearch,
          address: "",
        },
      );

      (async () => {
        setIsCheckingCourier(true);
        try {
          const response = await fetch(
            `https://bdcourier.com/api/courier-check`,
            {
              method: "POST",
              headers: {
                "Content-type": "application/json",
                Authorization: `Bearer ${process.env.NEXT_PUBLIC_BDCOURIER_TOKEN}`,
              },
              body: JSON.stringify({ phone: debouncedSearch }),
            },
          );
          const data = await response.json();
          setCourierData(data?.courierData?.summary || {});
        } catch {
          setCourierData({});
        } finally {
          setIsCheckingCourier(false);
        }
      })();
    }
  }, [debouncedSearch, customers, form]);

  // Derived financial values for summary calculation
  const subtotal = useMemo(() => {
    return watchedProducts.reduce(
      (sum, product) =>
        sum +
        (Number(product?.quantity || 0) * Number(product?.sellPrice || 0) -
          Number(product?.discount || 0)),
      0,
    );
  }, [watchedProducts]);

  const paidByCustomer = useMemo(() => {
    return subtotal + shippingCustomer - overallDiscount;
  }, [subtotal, shippingCustomer, overallDiscount]);

  const totalShippingCharge = useMemo(() => {
    return shippingCustomer + shippingMerchant;
  }, [shippingCustomer, shippingMerchant]);

  const totalIncome = useMemo(() => {
    return paidByCustomer - totalShippingCharge - otherCost - courierTax;
  }, [paidByCustomer, totalShippingCharge, otherCost, courierTax]);

  const totalPurchase = useMemo(() => {
    return watchedProducts.reduce(
      (sum, product) =>
        sum + Number(product?.quantity || 0) * Number(product?.purchasePrice || 0),
      0,
    );
  }, [watchedProducts]);

  const netProfit = useMemo(() => {
    return totalIncome - totalPurchase;
  }, [totalIncome, totalPurchase]);

  // Courier delivery performance metrics
  const hasCourierData = Boolean(courierData && Object.keys(courierData).length > 0);
  const courierSuccessRatio = Number(courierData?.success_ratio || 0);

  // Handle form submission
  async function onSubmit(values) {
    // Create customer if needed
    if (!values.customer._id) {
      const { success, createdCustomer } = await createCustomer(
        values.customer,
      );
      if (success) {
        toast.success("Customer created successfully!");
        values.customer = createdCustomer?._id;
      } else {
        toast.error(
          "Failed to create customer. Please check the details and try again.",
        );
        return;
      }
    } else {
      values.customer = values.customer._id;
    }

    // Clean up products array for submission
    values.products = values.products.map(
      ({ _id, quantity, purchasePrice, sellPrice, discount }) => ({
        product: _id,
        quantity,
        purchasePrice,
        sellPrice,
        discount,
      }),
    );

    let { success, createdCustomerEntry } = await createCustomerEntry(values);
    if (success) {
      toast.success("Customer entry created successfully!");
      if (values.sendToSteadfast) {
        try {
          const { consignment } =
            await sendOrderToSteadfast(createdCustomerEntry);
          const { success: updateSuccess, updatedCustomerEntry } =
            await updateCustomerEntry(createdCustomerEntry._id, {
              cnNumber: consignment.consignment_id,
            });
          createdCustomerEntry = updatedCustomerEntry;
          if (updateSuccess) {
            toast.success(`Order sent to Steadfast successfully!`);
          } else {
            toast.error("Failed to save the CN number to the entry.");
          }
        } catch (error) {
          toast.error(error.message || "Failed to send order to Steadfast.");
        }
      }
      try {
        const { pdf } = await import("@react-pdf/renderer");
        const blob = await pdf(
          <EntryPDF entry={createdCustomerEntry} />,
        ).toBlob();
        const url = URL.createObjectURL(blob);
        const win = window.open(url, "_blank");
        if (win) {
          try {
            win.focus();
            win.print();
          } catch {
            // PDF already opened; user prints manually
          }
        }
      } catch (err) {
        console.error(err);
      }
      setCourierData({});
      form.reset({
        invoiceNumber: "",
        cnNumber: "",
        orderStatus: ORDER_STATUSES[0],
        customer: { name: "", mobileNumber: "", address: "" },
        orderDate: inputDateFormat(new Date()),
        entryDate: inputDateFormat(new Date()),
        paymentDate: undefined,
        products: [],
        shippingCustomer: "",
        shippingMerchant: "",
        shippingMethod: SHIPPING_METHODS[0],
        otherCost: "",
        courierTax: "",
        overallDiscount: "",
        note: "",
        message: "",
        entrySource: ENTRY_SOURCES[ENTRY_SOURCES.length - 1],
        sendToSteadfast: true,
      });
      const [refreshedProducts, refreshedCustomers] = await Promise.all([
        fetchProducts(),
        fetchCustomers(),
      ]);
      setProducts(refreshedProducts || []);
      setCustomers(refreshedCustomers || []);
    } else {
      toast.error("Failed to create customer entry. Please try again.");
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-6 sm:gap-8 max-w-7xl mx-auto w-full pb-16"
      >
        {/* Header Section */}
        <header className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
                Add Customer Entry
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Manage order placement, customer profile, pricing calculations, and courier dispatch.
              </p>
            </div>

            {/* Quick Metadata Controls */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem className="w-full sm:w-44 space-y-0">
                    <FormControl>
                      <Input
                        placeholder="Invoice # (optional)"
                        className="bg-card text-foreground"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="orderStatus"
                render={({ field }) => (
                  <FormItem className="w-[calc(50%-4px)] sm:w-36 space-y-0">
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        aria-label="Order Status"
                      >
                        <SelectTrigger className="w-full bg-card" tabIndex={-1}>
                          <SelectValue placeholder="Order Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {ORDER_STATUSES.map((status) => (
                              <SelectItem key={status} value={status}>
                                {status}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="entrySource"
                render={({ field }) => (
                  <FormItem className="w-[calc(50%-4px)] sm:w-40 space-y-0">
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        aria-label="Entry Source"
                      >
                        <SelectTrigger className="w-full bg-card" tabIndex={-1}>
                          <SelectValue placeholder="Entry Source" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {ENTRY_SOURCES.map((source) => (
                              <SelectItem key={source} value={source}>
                                {source}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Tracking section for Shipped or Delivered */}
          {["Shipped", "Delivered"].includes(orderStatus) ? (
            <Card className="border-primary/20 bg-primary/5 p-3.5 sm:p-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
                <FormField
                  control={form.control}
                  name="cnNumber"
                  render={({ field }) => (
                    <FormItem className="w-full sm:w-48 shrink-0 space-y-0">
                      <FormControl>
                        <Input
                          placeholder="CN Number"
                          className="bg-background text-foreground"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem className="grow space-y-0">
                      <FormControl>
                        <Input
                          placeholder="Tracking Link or SMS note"
                          className="bg-background text-foreground"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  disabled={!customer?.mobileNumber || !trackingLink}
                  onClick={async () => {
                    try {
                      const { success, message } =
                        await sendParcelTrackingMessage(
                          customer.mobileNumber,
                          shippingMethod,
                          trackingLink,
                        );
                      if (success) {
                        toast.success(message);
                      } else {
                        toast.error(message);
                      }
                    } catch {
                      toast.error("Failed to send sms");
                    }
                  }}
                  aria-label="Send Tracking Link"
                  className="w-full sm:w-auto shrink-0"
                >
                  <MessageSquareIcon data-icon="inline-start" />
                  Send SMS
                </Button>
              </div>
            </Card>
          ) : null}
        </header>

        {/* Customer Information Card */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <UserIcon className="size-5 text-muted-foreground" />
              Customer Information
            </CardTitle>
            <CardDescription>
              Customer contact details and delivery reliability check
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Mobile Number & Courier Intelligence */}
            <FormField
              control={form.control}
              name="customer.mobileNumber"
              render={({ field }) => (
                <FormItem className="sm:col-span-1">
                  <FormLabel>
                    Mobile Number <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="01XXXXXXXXX"
                      className="bg-card text-foreground"
                      {...field}
                    />
                  </FormControl>
                  {/* Courier delivery feedback badges */}
                  {hasCourierData ? (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <Badge
                        variant={
                          courierSuccessRatio >= 80
                            ? "success"
                            : courierSuccessRatio >= 60
                            ? "warning"
                            : "destructive"
                        }
                      >
                        {courierSuccessRatio}% Success
                      </Badge>
                      <Badge variant="secondary">
                        Delivered: {courierData?.success_parcel || 0}
                      </Badge>
                      <Badge variant="outline">
                        Cancelled: {courierData?.cancelled_parcel || 0}
                      </Badge>
                    </div>
                  ) : isCheckingCourier ? (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 pt-1">
                      <Loader2Icon className="size-3 animate-spin" />
                      Checking courier history...
                    </p>
                  ) : null}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Name */}
            <FormField
              control={form.control}
              name="customer.name"
              render={({ field }) => (
                <FormItem className="sm:col-span-1">
                  <FormLabel>
                    Customer Name <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. John Doe"
                      className="bg-card text-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Address */}
            <FormField
              control={form.control}
              name="customer.address"
              render={({ field }) => (
                <FormItem className="sm:col-span-2 lg:col-span-1">
                  <FormLabel>
                    Address <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g. 123 Main St, City, Country"
                      className="bg-card text-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Order Date */}
            <FormField
              control={form.control}
              name="orderDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Order Date <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <InputDatePicker {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Entry Date */}
            <FormField
              control={form.control}
              name="entryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Entry Date <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <InputDatePicker {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Payment Date */}
            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Date</FormLabel>
                  <FormControl>
                    <InputDatePicker {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Products Section */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex flex-col gap-1">
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <ShoppingCartIcon className="size-5 text-muted-foreground" />
                  Order Products <span className="text-destructive">*</span>
                </CardTitle>
                <CardDescription>
                  Select inventory products and manage quantity, unit price, and discount
                </CardDescription>
              </div>

              {/* Add Product Dropdown */}
              <div className="w-full sm:w-72 md:w-80">
                <Select
                  value=""
                  onValueChange={(value) => {
                    const selectedProduct = products.find(
                      (product) => product._id === value,
                    );
                    if (selectedProduct) {
                      productFieldArray.append({
                        ...selectedProduct,
                        quantity: 1,
                        discount: 0,
                      });
                      setProducts((prev) => prev.filter((p) => p._id !== value));
                    }
                  }}
                >
                  <SelectTrigger className="w-full bg-card" tabIndex={-1}>
                    <SelectValue placeholder="Add product to order..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {products
                        .slice()
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map((product) => (
                          <SelectItem key={product._id} value={product._id}>
                            <div className="flex items-center justify-between gap-4 w-full">
                              <span className="font-medium truncate max-w-[170px] sm:max-w-[200px]">
                                {product.name}
                              </span>
                              <span className="text-xs text-muted-foreground shrink-0 font-mono">
                                ৳{product.sellPrice}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>

          <CardContent className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="products"
              render={() => <FormMessage />}
            />

            {productFieldArray.fields.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 sm:p-12 text-center bg-muted/20">
                <PackageIcon className="size-10 text-muted-foreground/60 mb-2" />
                <h3 className="font-semibold text-base text-foreground">
                  No products added yet
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mt-1">
                  Choose a product from the dropdown above to add it to this order entry.
                </p>
              </div>
            ) : (
              <div className="relative w-full">
                {/* Responsive Table for Desktop & Cards for Mobile */}
                <Table className="w-full block md:table">
                  <TableHeader className="hidden md:table-header-group">
                    <TableRow>
                      <TableHead className="min-w-[180px]">Product</TableHead>
                      <TableHead className="w-24 text-right">Quantity</TableHead>
                      <TableHead className="w-20 text-center">In Stock</TableHead>
                      <TableHead className="w-28 text-right">Purchase (৳)</TableHead>
                      <TableHead className="w-28 text-right">Sell Price (৳)</TableHead>
                      <TableHead className="w-24 text-right">Discount (৳)</TableHead>
                      <TableHead className="w-28 text-right">Subtotal</TableHead>
                      <TableHead className="w-16 text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="flex flex-col gap-3.5 md:table-row-group">
                    {productFieldArray.fields.map((product, index) => {
                      const watched = watchedProducts[index];
                      const qty = Number(watched?.quantity ?? product.quantity ?? 0);
                      const sell = Number(watched?.sellPrice ?? product.sellPrice ?? 0);
                      const disc = Number(watched?.discount ?? product.discount ?? 0);
                      const itemSubtotal = qty * sell - disc;

                      return (
                        <TableRow
                          key={product.id || product._id || index}
                          className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 sm:p-4 rounded-xl border border-border bg-card/60 shadow-xs md:table-row md:border-b md:rounded-none md:p-0 md:shadow-none md:bg-transparent"
                        >
                          {/* Product Info / Header */}
                          <TableCell className="col-span-2 sm:col-span-4 md:col-span-1 md:table-cell md:p-2.5">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-semibold text-sm sm:text-base text-foreground">
                                  {product.name}
                                </span>
                                <div className="flex items-center gap-1.5 md:hidden">
                                  <span className="text-xs text-muted-foreground">In stock:</span>
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono">
                                    {product.inStock}
                                  </Badge>
                                </div>
                              </div>
                              {/* Mobile Delete Action */}
                              <div className="md:hidden">
                                <Button
                                  type="button"
                                  size="icon"
                                  variant="ghost"
                                  className="size-8 text-destructive hover:bg-destructive/10"
                                  tabIndex={-1}
                                  onClick={() => {
                                    productFieldArray.remove(index);
                                    setProducts((prev) => [...prev, product]);
                                  }}
                                  aria-label="Remove product"
                                >
                                  <TrashIcon className="size-4" />
                                </Button>
                              </div>
                            </div>
                          </TableCell>

                          {/* Quantity */}
                          <TableCell className="col-span-1 md:table-cell md:p-2.5">
                            <div className="flex flex-col gap-1 md:block">
                              <span className="text-xs font-medium text-muted-foreground md:hidden">
                                Quantity
                              </span>
                              <FormField
                                control={form.control}
                                name={`products.${index}.quantity`}
                                render={({ field }) => (
                                  <FormItem className="space-y-0">
                                    <FormControl>
                                      <Input
                                        type="number"
                                        className="w-full md:w-20 text-right h-9"
                                        min={0.25}
                                        step={0.25}
                                        placeholder="0"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </TableCell>

                          {/* In Stock (Desktop Cell) */}
                          <TableCell className="hidden md:table-cell md:p-2.5 text-center">
                            <Badge variant="secondary" className="font-mono">
                              {product.inStock}
                            </Badge>
                          </TableCell>

                          {/* Purchase Price */}
                          <TableCell className="col-span-1 md:table-cell md:p-2.5">
                            <div className="flex flex-col gap-1 md:block">
                              <span className="text-xs font-medium text-muted-foreground md:hidden">
                                Purchase (৳)
                              </span>
                              <FormField
                                control={form.control}
                                name={`products.${index}.purchasePrice`}
                                render={({ field }) => (
                                  <FormItem className="space-y-0">
                                    <FormControl>
                                      <Input
                                        type="number"
                                        className="w-full md:w-24 text-right h-9"
                                        min={0}
                                        placeholder="0"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </TableCell>

                          {/* Sell Price */}
                          <TableCell className="col-span-1 md:table-cell md:p-2.5">
                            <div className="flex flex-col gap-1 md:block">
                              <span className="text-xs font-medium text-muted-foreground md:hidden">
                                Sell Price (৳)
                              </span>
                              <FormField
                                control={form.control}
                                name={`products.${index}.sellPrice`}
                                render={({ field }) => (
                                  <FormItem className="space-y-0">
                                    <FormControl>
                                      <Input
                                        type="number"
                                        className="w-full md:w-24 text-right h-9"
                                        min={0}
                                        placeholder="0"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </TableCell>

                          {/* Discount */}
                          <TableCell className="col-span-1 md:table-cell md:p-2.5">
                            <div className="flex flex-col gap-1 md:block">
                              <span className="text-xs font-medium text-muted-foreground md:hidden">
                                Discount (৳)
                              </span>
                              <FormField
                                control={form.control}
                                name={`products.${index}.discount`}
                                render={({ field }) => (
                                  <FormItem className="space-y-0">
                                    <FormControl>
                                      <Input
                                        type="number"
                                        className="w-full md:w-20 text-right h-9"
                                        min={0}
                                        placeholder="0"
                                        {...field}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </TableCell>

                          {/* Subtotal */}
                          <TableCell className="col-span-2 sm:col-span-4 md:col-span-1 md:table-cell md:p-2.5 md:text-right">
                            <div className="flex items-center justify-between border-t border-dashed border-border pt-2 md:border-0 md:pt-0 md:justify-end">
                              <span className="text-xs font-medium text-muted-foreground md:hidden">
                                Item Subtotal
                              </span>
                              <span className="font-semibold text-foreground font-mono">
                                ৳{itemSubtotal.toLocaleString()}
                              </span>
                            </div>
                          </TableCell>

                          {/* Desktop Delete Action */}
                          <TableCell className="hidden md:table-cell md:p-2.5 text-center">
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              className="size-8 text-destructive hover:bg-destructive/10"
                              tabIndex={-1}
                              onClick={() => {
                                productFieldArray.remove(index);
                                setProducts((prev) => [...prev, product]);
                              }}
                              aria-label="Remove product"
                            >
                              <TrashIcon className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bottom Section: Logistics & Financial Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Logistics, Charges & Notes (7 cols on lg) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <TruckIcon className="size-5 text-muted-foreground" />
                  Shipping & Logistics
                </CardTitle>
                <CardDescription>
                  Delivery carrier configuration and handling fee details
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <FormField
                  control={form.control}
                  name="shippingCustomer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Shipping (Customer) <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          className="text-right"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shippingMerchant"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Shipping (Merchant) <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          className="text-right"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shippingMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Shipping Method <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="w-full bg-card" tabIndex={-1}>
                            <SelectValue placeholder="Shipping Method" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {SHIPPING_METHODS.map((method) => (
                                <SelectItem key={method} value={method}>
                                  {method}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="otherCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Cost</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="0"
                          className="text-right"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Note Section */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileTextIcon className="size-5 text-muted-foreground" />
                  Order Note
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          className="min-h-24 resize-y bg-card"
                          placeholder="Additional notes or instructions for delivery/dispatch (optional)"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              const formEl = e.target.form;
                              const index = Array.prototype.indexOf.call(formEl, e.target);
                              const next = formEl.elements[index + 1];
                              if (next) {
                                next.focus();
                              }
                            }
                          }}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Dispatch Integration Checkbox */}
            <Card className="p-4 bg-muted/20">
              <FormField
                control={form.control}
                name="sendToSteadfast"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="size-5"
                      />
                    </FormControl>
                    <div className="flex flex-col gap-0.5">
                      <FormLabel className="text-sm font-medium cursor-pointer">
                        Send Order to Steadfast
                      </FormLabel>
                      <p className="text-xs text-muted-foreground">
                        Automatically register consignment and save CN tracking number
                      </p>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </Card>
          </div>

          {/* Right Column: Financial Overview & Submit (5 cols on lg, sticky on desktop) */}
          <div className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-16">
            <Card className="border-border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl">Financial Summary</CardTitle>
                <CardDescription>
                  Real-time calculation of revenue, costs, and profit margin
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                {/* Subtotal */}
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium font-mono text-foreground">
                    ৳{subtotal.toLocaleString()}
                  </span>
                </div>

                {/* Paid by Customer */}
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Paid by Customer</span>
                  <span className="font-medium font-mono text-foreground">
                    ৳{paidByCustomer.toLocaleString()}
                  </span>
                </div>

                {/* Total Shipping Charge */}
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Total Shipping Charge</span>
                  <span className="font-medium font-mono text-foreground">
                    ৳{totalShippingCharge.toLocaleString()}
                  </span>
                </div>

                {/* Courier Tax */}
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Courier Tax</span>
                  <div className="w-24 sm:w-28">
                    <FormField
                      control={form.control}
                      name="courierTax"
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              className="h-8 text-right font-mono"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Total Income */}
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Total Income</span>
                  <span className="font-medium font-mono text-foreground">
                    ৳{totalIncome.toLocaleString()}
                  </span>
                </div>

                {/* Total Purchase */}
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Total Purchase Cost</span>
                  <span className="font-medium font-mono text-foreground">
                    ৳{totalPurchase.toLocaleString()}
                  </span>
                </div>

                {/* Overall Discount */}
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground">Overall Discount</span>
                  <div className="w-24 sm:w-28">
                    <FormField
                      control={form.control}
                      name="overallDiscount"
                      render={({ field }) => (
                        <FormItem className="space-y-0">
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              className="h-8 text-right font-mono"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator className="my-1" />

                {/* Net Profit Summary Pill */}
                <div
                  className={cn(
                    "flex justify-between items-center p-3.5 rounded-lg border transition-colors",
                    netProfit > 0
                      ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                      : netProfit < 0
                      ? "bg-destructive/10 border-destructive/20 text-destructive"
                      : "bg-muted border-border text-foreground"
                  )}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-sm">Net Profit</span>
                    <span className="text-xs opacity-80">Calculated margin</span>
                  </div>
                  <span className="text-xl font-bold font-mono">
                    ৳{netProfit.toLocaleString()}
                  </span>
                </div>
              </CardContent>

              <CardFooter className="pt-2 pb-6">
                <Button
                  type="submit"
                  size="lg"
                  disabled={form.formState.isSubmitting}
                  className="w-full text-base font-semibold"
                >
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2Icon className="animate-spin" data-icon="inline-start" />
                      Creating Entry...
                    </>
                  ) : (
                    <>
                      <CheckCircle2Icon data-icon="inline-start" />
                      Add Customer Entry
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}
