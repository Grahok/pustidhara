export default function orderConfirmedSMS(customerName) {
  return `As Salamu Alaikum${customerName ? `, ${customerName}`: ""}. Your order has been confirmed. It'll be handed over to the courier company soon.
  
Thank you for staying with Pushtidhara.`;
}
