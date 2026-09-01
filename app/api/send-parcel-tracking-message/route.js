import { connectToDatabase } from "@/lib/mongoose";
import CustomerEntry from "@/models/CustomerEntry";

export async function POST(req) {
  const { mobileNumber, shippingMethod, trackingLink, customerEntryId } =
    await req.json();

  function parcelTrackingMessage(shippingMethod, trackingLink) {
    return encodeURIComponent(`As Salamu Alaikum, Sir/Mam. Your Parcel has been handed to ${shippingMethod} courier. Please visit this link to track your parcel.
    
Tracking Link: ${trackingLink}.
Thank you for staying with Pustidhara.`);
  }

  const url = `https://panel.smsbangladesh.com/api?user=${encodeURIComponent(
    process.env.SMS_BANGLADESH_EMAIL
  )}&password=${encodeURIComponent(
    process.env.SMS_BANGLADESH_PASSWORD
  )}&to=88${encodeURIComponent(mobileNumber)}&text=${parcelTrackingMessage(
    shippingMethod,
    trackingLink
  )}`;

  const response = await fetch(url);

  const data = await response.json();
  const { success, message } = data;

  if (success === 1) {
    await connectToDatabase();
    await CustomerEntry.findByIdAndUpdate(customerEntryId, {
      message: trackingLink,
    });
  }

  return new Response(
    JSON.stringify({
      success,
      message,
    }),
    {
      headers: { "Content-type": "application/json" },
    }
  );
}
