"use client";

import { ORDER_STATUSES } from "@/constants/orderStatuses";
import { ENTRY_SOURCES } from "@/constants/entrySources";

import { useEffect, useState } from "react";
import SummarySection from "@/features/entries/customer/view/components/SummarySection";
import ProductSection from "@/features/entries/customer/view/components/ProductSection";
import CustomerForm from "@/features/entries/customer/view/components/CustomerForm";
import combineDateWithCurrentTime from "@/utils/combineDateWithCurrentTime";
import React from "react";
import { FaPencil, FaPrint } from "react-icons/fa6";
import inputDateFormat from "@/utils/inputDateFormat";
import Toast from "@/components/Toast";
import { Button } from "@/components/ui/button";
import sendParcelTrackingMessage from "@/features/entries/customer/add/actions/sendParcelTrackingMessage";
import { MessageSquareIcon } from "lucide-react";
import fetchCustomerEntry from "@/features/entries/customer/view/actions/fetchCustomerEntry";
import EntryPDF from "@/features/entries/customer/view/components/EntryPDF";

export default function EditEntry({ params }) {
  const { entryId } = React.use(params);
  const [isEditable, setIsEditable] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState(0);
  const [cnNumber, setCnNumber] = useState("");
  const [trackingLink, setTrackingLink] = useState("");
  const [entry, setEntry] = useState();
  const [orderStatus, setOrderStatus] = useState("Pending");
  const [entrySource, setEntrySource] = useState(
    ENTRY_SOURCES[ENTRY_SOURCES.length - 1],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [overallDiscount, setOverallDiscount] = useState(0);
  useEffect(() => {
    (async () => {
      try {
        const entry = await fetchCustomerEntry(entryId);

        setEntry({
          ...entry,
          orderDate: entry.orderDate ? inputDateFormat(entry.orderDate) : "",
          entryDate: entry.entryDate ? inputDateFormat(entry.entryDate) : "",
          paymentDate: entry.paymentDate
            ? inputDateFormat(entry.paymentDate)
            : "",
        });
        setInvoiceNumber(entry.invoiceNumber);
        setCnNumber(entry.cnNumber);
        setTrackingLink(entry.message);
        setOrderStatus(entry.orderStatus);
        setEntrySource(
          entry.entrySource || ENTRY_SOURCES[ENTRY_SOURCES.length - 1],
        );
        setShippingCustomer(entry.shippingCustomer);
        setShippingMerchant(entry.shippingMerchant);
        setOtherCost(entry.otherCost);
        setSelectedProducts(entry.products);
        setShippingMethod(entry.shippingMethod);
        setNote(entry.note);
        setCourierTax(entry.courierTax);
        setOverallDiscount(entry.overallDiscount);
      } catch (error) {
        console.error("Error loading entry:", error);
      }
    })();
  }, []);

  const subtotal = selectedProducts.reduce(
    (sum, row) => sum + row.quantity * row.sellPrice - row.discount,
    0,
  );
  const totalPurchasePrice = selectedProducts.reduce(
    (sum, row) => sum + row.quantity * row.purchasePrice,
    0,
  );
  const [shippingCustomer, setShippingCustomer] = useState(0);
  const paidByCustomer = subtotal + shippingCustomer - overallDiscount;
  const [shippingMerchant, setShippingMerchant] = useState(0);
  const totalShippingCharge = shippingCustomer + shippingMerchant;
  const [otherCost, setOtherCost] = useState(0);
  const [courierTax, setCourierTax] = useState(0);
  const totalIncome =
    paidByCustomer - totalShippingCharge - courierTax - otherCost;
  const netProfit = totalIncome - totalPurchasePrice;
  const [toast, setToast] = useState({ show: false, message: "" });
  const [shippingMethod, setShippingMethod] = useState("Steadfast");
  const [note, setNote] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const totalQuantity = Number(
        selectedProducts.reduce((sum, p) => sum + p.quantity, 0),
      );
      const totalSellPrice = Number(
        selectedProducts.reduce((sum, p) => sum + p.sellPrice * p.quantity, 0),
      );
      const totalDiscount =
        Number(selectedProducts.reduce((sum, p) => sum + p.discount, 0)) +
        Number(overallDiscount);

      const entry = {
        invoiceNumber,
        cnNumber,
        orderStatus,
        entrySource,
        orderDate: combineDateWithCurrentTime(e.target.orderDate.value),
        entryDate: combineDateWithCurrentTime(e.target.entryDate.value),
        paymentDate:
          combineDateWithCurrentTime(e.target.paymentDate.value) || null,
        products: selectedProducts.map((p) => ({
          product: p.product._id,
          quantity: Number(p.quantity),
          purchasePrice: Number(p.purchasePrice),
          sellPrice: Number(p.sellPrice),
          discount: Number(p.discount || 0),
          subtotal: Number(p.quantity * p.sellPrice - p.discount),
        })),
        subtotal,
        paidByCustomer,
        shippingCustomer,
        shippingMerchant,
        totalShippingCharge,
        shippingMethod,
        otherCost,
        note,
        courierTax,
        totalQuantity,
        totalPurchasePrice,
        totalSellPrice,
        totalDiscount,
        overallDiscount,
        totalIncome,
        netProfit,
      };

      // 💾 Update the entry
      const resppnse = await fetch(`/api/entries/customer/${entryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(entry),
      });

      if (!resppnse.ok) {
        throw new Error("Failed to save entry.");
      }

      // ✅ Show success toast
      setToast({ show: true, message: "Entry updated successfully." });
      setTimeout(() => {
        setToast((prev) => ({
          ...prev,
          show: false,
        }));
      }, 2000);
      window.history.back();
    } catch (err) {
      console.error(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const blob = await pdf(<EntryPDF entry={entry} />).toBlob();
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
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-800 flex flex-col gap-8">
      <header className="flex justify-between items-center gap-6">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">View Entry</h1>
          <button
            type="button"
            onClick={() => setIsEditable((prev) => !prev)}
            className="p-2 bg-green-600 text-white rounded-md cursor-pointer"
          >
            <FaPencil />
          </button>
          {entry && (
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 bg-green-600 text-white rounded-md cursor-pointer"
            >
              <FaPrint />
            </button>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Invoice Number"
              className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={invoiceNumber || ""}
              onChange={(e) => setInvoiceNumber(Number(e.target.value))}
              disabled={!isEditable}
            />

            <select
              name="orderStatus"
              id="orderStatus"
              className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={orderStatus}
              onChange={(e) => setOrderStatus(e.target.value)}
              disabled={!isEditable}
            >
              {ORDER_STATUSES.map((orderStatus, index) => (
                <option key={index} value={orderStatus}>
                  {orderStatus}
                </option>
              ))}
            </select>

            <select
              name="entrySource"
              id="entrySource"
              className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={entrySource}
              onChange={(e) => setEntrySource(e.target.value)}
              disabled={!isEditable}
            >
              {ENTRY_SOURCES.map((source, index) => (
                <option key={index} value={source}>
                  {source}
                </option>
              ))}
            </select>
          </div>
          {["Shipped", "Delivered"].includes(orderStatus) && (
            <>
              <input
                type="text"
                name="cnNumber"
                id="cnNumber"
                placeholder="CN Number"
                className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                value={cnNumber || ""}
                onChange={(e) => setCnNumber(e.target.value)}
                disabled={!isEditable}
              />
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  name="trackingLink"
                  id="trackingLink"
                  placeholder="Tracking Link"
                  className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none grow"
                  value={trackingLink}
                  onChange={(e) => setTrackingLink(e.target.value)}
                />
                <Button
                  className="flex items-center"
                  onClick={async () => {
                    const { success, message } =
                      await sendParcelTrackingMessage(
                        entry.customer.mobileNumber,
                        shippingMethod,
                        trackingLink,
                        entryId,
                      );
                    setToast((prev) => ({
                      ...prev,
                      show: true,
                      message: message,
                      type: success == 1 ? "success" : "error",
                    }));

                    setTimeout(() => {
                      setToast((prev) => ({
                        ...prev,
                        show: false,
                      }));
                    }, 1500);
                  }}
                >
                  <MessageSquareIcon />
                  Send
                </Button>
              </div>
              {entry.message && "SMS Sent Before"}
            </>
          )}
        </div>
      </header>

      <form onSubmit={handleSubmit} className="space-y-10">
        {/* Customer Section */}
        <CustomerForm entry={entry} isEditable={isEditable} />

        {/* Product Section */}
        <ProductSection
          entry={entry}
          isEditable={isEditable}
          selectedProducts={selectedProducts}
          setSelectedProducts={setSelectedProducts}
        />

        {/* Summary */}
        <SummarySection
          isEditable={isEditable}
          entry={entry}
          shippingCustomer={shippingCustomer}
          setShippingCustomer={setShippingCustomer}
          shippingMerchant={shippingMerchant}
          setShippingMerchant={setShippingMerchant}
          totalShippingCharge={totalShippingCharge}
          shippingMethod={shippingMethod}
          setShippingMethod={setShippingMethod}
          otherCost={otherCost}
          setOtherCost={setOtherCost}
          note={note}
          setNote={setNote}
          courierTax={courierTax}
          setCourierTax={setCourierTax}
          overallDiscount={overallDiscount}
          setOverallDiscount={setOverallDiscount}
          subtotal={subtotal}
          paidByCustomer={paidByCustomer}
          totalPurchasePrice={totalPurchasePrice}
          totalIncome={totalIncome}
          netProfit={netProfit}
        />

        {/* Error or Loading Feedback */}
        {error && <div className="text-red-600">{error}</div>}
        {isEditable && (
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition cursor-pointer disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Updating..." : "Update Entry"}
          </button>
        )}
      </form>
      <Toast
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={() =>
          setToast((prev) => ({
            ...prev,
            show: false,
          }))
        }
      />
    </main>
  );
}
