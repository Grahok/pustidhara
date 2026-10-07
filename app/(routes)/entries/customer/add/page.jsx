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
import { MessageSquareIcon, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";
import fetchProducts from "@/features/products/actions/fetchProducts";
import createCustomer from "@/features/customers/actions/createCustomer";
import { Textarea } from "@/components/ui/textarea";
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
import { Checkbox } from "@/components/ui/checkbox";
import EntryPDF from "@/features/entries/customer/view/components/EntryPDF";

const customerSchema = z.object({
  _id: z.string().optional(),
  name: z.string().min(1),
  mobileNumber: z.string().regex(/^01.{9}$/),
  address: z.string().min(1),
});

const productSchema = z.object({
  _id: z.string(),
  name: z.string(),
  quantity: z.coerce.number(),
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
});

export default function ProfileForm() {
  // Using enter-navigation hook
  useEnterNavigation({ autoSubmit: false });

  // State for products, customers, courier data, and loading
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [courierData, setCourierData] = useState({});

  // Fetch customers and products on mount
  useEffect(() => {
    (async () => {
      setCustomers(await fetchCustomers());
      setProducts(await fetchProducts());
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
      sendToSteadfast: true,
    },
  });

  // Field array for products
  const productFieldArray = useFieldArray({
    control: form.control,
    name: "products",
  });

  // Watchers for form fields
  const watchedProducts = useWatch({ control: form.control, name: "products" });
  const [
    shippingCustomer,
    shippingMerchant,
    otherCost,
    courierTax,
    overallDiscount,
  ] = useWatch({
    control: form.control,
    name: [
      "shippingCustomer",
      "shippingMerchant",
      "otherCost",
      "courierTax",
      "overallDiscount",
    ],
  }).map(Number);
  const [trackingLink, customer, orderStatus, shippingMethod] =
    useWatch({
      control: form.control,
      name: ["message", "customer", "orderStatus", "shippingMethod"],
    }) ?? [];

  // Debounced search for customer mobile number
  const debouncedSearch = useDebounce(customer.mobileNumber, 500);

  // Fetch courier data and autofill customer if found
  useEffect(() => {
    if (
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
        }
      })();
    }
  }, [debouncedSearch]);

  // Derived values for summary table
  const subtotal = watchedProducts.reduce(
    (sum, product) =>
      sum + (product.quantity * product.sellPrice - product.discount || 0),
    0,
  );
  const paidByCustomer = subtotal + shippingCustomer - overallDiscount;
  const totalShippingCharge = shippingCustomer + shippingMerchant;
  const totalIncome =
    paidByCustomer - totalShippingCharge - otherCost - courierTax;
  const totalPurchase = watchedProducts.reduce(
    (sum, product) => sum + (product.quantity * product.purchasePrice || 0),
    0,
  );
  const netProfit = totalIncome - totalPurchase;

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
          const { success, updatedCustomerEntry } = await updateCustomerEntry(
            createdCustomerEntry._id,
            { cnNumber: consignment.consignment_id },
          );
          createdCustomerEntry = updatedCustomerEntry;
          if (success) {
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
      form.reset();
      setProducts(await fetchProducts());
      setCustomers(await fetchCustomers());
    } else {
      toast.error("Failed to create customer entry. Please try again.");
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
        {/* Header Section */}
        <section className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <h1 className="text-3xl font-bold text-gray-800">
            Add Customer Entry
          </h1>
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <FormField
                control={form.control}
                name="invoiceNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        placeholder="Invoice Number (optional)"
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
                  <FormItem>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                        aria-label="Order Status"
                      >
                        <SelectTrigger className="w-32" tabIndex={-1}>
                          <SelectValue placeholder="Order Status" />
                        </SelectTrigger>
                        <SelectContent>
                          {ORDER_STATUSES.map((orderStatus, index) => (
                            <SelectItem key={index} value={orderStatus}>
                              {orderStatus}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Tracking section for shipped/delivered */}
            {["Shipped", "Delivered"].includes(orderStatus) && (
              <>
                <FormField
                  control={form.control}
                  name="cnNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input placeholder="CN Number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-x-2">
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem className="grow">
                        <FormControl>
                          <Input placeholder="Tracking Link" {...field} />
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
                  >
                    <MessageSquareIcon />
                    Send
                  </Button>
                </div>
              </>
            )}
          </div>
        </section>
        {/* Customer Info Section */}
        <section className="space-y-6 p-6 bg-white rounded-lg shadow-md border">
          <h2 className="text-2xl font-semibold text-gray-700">
            Customer Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
            <FormField
              control={form.control}
              name="customer.mobileNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Mobile Number<span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="01XXXXXXXXX" {...field} />
                  </FormControl>
                  {!!Object.keys(courierData).length && (
                    <p className="text-sm text-gray-500">
                      Delivered:{" "}
                      <span className="font-semibold">
                        {courierData?.success_parcel || 0}
                      </span>
                      , Cancelled:{" "}
                      <span className="font-semibold">
                        {courierData?.cancelled_parcel || 0}
                      </span>
                      . Success Rate:{" "}
                      <span className="font-semibold">
                        {courierData?.success_ratio || 0}%
                      </span>
                    </p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customer.name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Name<span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="customer.address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Address<span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="123 Main St" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="orderDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Order Date<span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <InputDatePicker {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="entryDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Entry Date<span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <InputDatePicker {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
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
          </div>
        </section>

        {/* Products Section */}
        <section className="space-y-6 p-6 bg-white rounded-lg shadow-md border">
          <h2 className="text-2xl font-semibold text-gray-700">
            Products<span className="text-red-500">*</span>
          </h2>
          <div className="space-y-2">
            <Select
              value={""}
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
                  setProducts(products.filter((p) => p._id !== value));
                }
              }}
            >
              <SelectTrigger className="w-50 max-w-80" tabIndex={-1}>
                <SelectValue placeholder="Add a product" />
              </SelectTrigger>
              <SelectContent>
                {products
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map((product, index) => (
                    <SelectItem key={index} value={product._id}>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium">
                          {product.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          ৳{product.sellPrice}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <FormField
              control={form.control}
              name="products"
              render={() => <FormMessage />}
            />
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>In Stock</TableHead>
                  <TableHead>Purchase Price</TableHead>
                  <TableHead>Sell Price</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Subtotal</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productFieldArray.fields.map((product, index) => (
                  <TableRow key={index}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`products[${index}].quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                className="w-20 p-1 border rounded text-right"
                                min={0.25}
                                step={0.25}
                                placeholder={0}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>{product.inStock}</TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`products[${index}].purchasePrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                className="w-20 p-1 border rounded text-right"
                                min={0}
                                placeholder={0}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`products[${index}].sellPrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                className="w-20 p-1 border rounded text-right"
                                min={0}
                                placeholder={0}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      <FormField
                        control={form.control}
                        name={`products[${index}].discount`}
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="number"
                                className="w-20 p-1 border rounded text-right"
                                min={0}
                                placeholder={0}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const watchedProduct = watchedProducts[index];
                        if (watchedProduct) {
                          const { quantity, sellPrice, discount } =
                            watchedProduct;
                          return quantity * sellPrice - discount || 0;
                        } else {
                          return 0;
                        }
                      })()}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        className="cursor-pointer"
                        size="icon"
                        variant="destructive"
                        tabIndex={-1}
                        onClick={() => {
                          productFieldArray.remove(index);
                          setProducts((prev) => [...prev, product]);
                        }}
                      >
                        <TrashIcon />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
        {/* Charges & Summary Section */}
        <section className="space-y-6 p-6 bg-white rounded-lg shadow-md border">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-y-4 justify-between">
              <FormField
                control={form.control}
                name="shippingCustomer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Shipping (Customer)<span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="number" placeholder={0} {...field} />
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
                      Shipping (Merchant)<span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="number" placeholder={0} {...field} />
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
                      Shipping Method<span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full" tabIndex={-1}>
                          <SelectValue placeholder="Shipping Method" />
                        </SelectTrigger>
                        <SelectContent>
                          {SHIPPING_METHODS.map((shippingMethod, index) => (
                            <SelectItem key={index} value={shippingMethod}>
                              {shippingMethod}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
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
                      <Input type="number" placeholder={0} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Table className="border-separate border-spacing-0">
              <TableBody>
                <TableRow>
                  <TableCell>Subtotal</TableCell>
                  <TableCell>{subtotal}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Paid by Customer</TableCell>
                  <TableCell>{paidByCustomer}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Shipping Charge</TableCell>
                  <TableCell>{totalShippingCharge}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Courier Tax</TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name="courierTax"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder={0}
                              className="w-20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Total Income</TableCell>
                  <TableCell>{totalIncome}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Total Purchase</TableCell>
                  <TableCell>{totalPurchase}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Overall Discount</TableCell>
                  <TableCell>
                    <FormField
                      control={form.control}
                      name="overallDiscount"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder={0}
                              className="w-20"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </TableCell>
                </TableRow>
                <TableRow className="font-semibold">
                  <TableCell>Net Profit</TableCell>
                  <TableCell>{netProfit}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
          {/* Note Section */}
          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Note</FormLabel>
                <FormControl>
                  <Textarea
                    className="min-h-24"
                    placeholder="Additional notes or instructions (optional)"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault(); // prevent newline
                        // Shift focus to the next form element
                        const form = e.target.form;
                        const index = Array.prototype.indexOf.call(
                          form,
                          e.target,
                        );
                        const next = form.elements[index + 1];
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
        </section>
        <FormField
          control={form.control}
          name="sendToSteadfast"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center border rounded-md p-4 gap-x-2 max-w-fit">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  {...field}
                />
              </FormControl>
              <FormLabel>Send to Steadfast</FormLabel>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="focus-visible:ring-ring/100">
          Add Entry
        </Button>
      </form>
    </Form>
  );
}
