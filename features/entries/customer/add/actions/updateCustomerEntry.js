"use server";

import { connectToDatabase } from "@/lib/mongoose";
import CustomerEntry from "@/models/CustomerEntry";
import mongooseDocumentToPlainObject from "@/utils/mongooseDocumentToPlainObject";

export default async function updateCustomerEntry(customerEntryId, updateData) {
  try {
    await connectToDatabase();
    const updatedCustomerEntry = await CustomerEntry.findByIdAndUpdate(
      customerEntryId,
      updateData,
      { new: true },
    );
    await updatedCustomerEntry.populate("customer products.product");
    return {
      success: true,
      updatedCustomerEntry: mongooseDocumentToPlainObject(updatedCustomerEntry),
    };
  } catch (_) {
    return { success: false, updatedCustomerEntry: null };
  }
}
