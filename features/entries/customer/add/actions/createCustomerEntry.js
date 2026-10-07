"use server";

import { connectToDatabase } from "@/lib/mongoose";
import CustomerEntry from "@/models/CustomerEntry";
import mongooseDocumentToPlainObject from "@/utils/mongooseDocumentToPlainObject";

export default async function createCustomerEntry(entryData) {
  try {
    await connectToDatabase();
    const createdCustomerEntry = await CustomerEntry.create(entryData);
    await createdCustomerEntry.populate("customer products.product");
    return {
      success: true,
      createdCustomerEntry: mongooseDocumentToPlainObject(createdCustomerEntry),
    };
  } catch (_) {
    return { success: false, createdCustomerEntry: null };
  }
}
