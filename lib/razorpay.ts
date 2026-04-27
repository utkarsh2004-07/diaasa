import crypto from "crypto";

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID!;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET!;
const RAZORPAY_API = "https://api.razorpay.com/v1";

async function razorpayRequest(
  endpoint: string,
  method: string,
  body?: object
) {
  const credentials = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString("base64");

  const response = await fetch(`${RAZORPAY_API}${endpoint}`, {
    method,
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.description || "Razorpay API error");
  return data;
}

export async function createRazorpayOrder(params: {
  amount: number; // in paise (INR * 100)
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}) {
  return razorpayRequest("/orders", "POST", {
    amount: Math.round(params.amount * 100), // convert to paise
    currency: params.currency || "INR",
    receipt: params.receipt,
    notes: params.notes || {},
  });
}

export function verifyRazorpaySignature(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): boolean {
  const body = `${params.razorpayOrderId}|${params.razorpayPaymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");
  return expectedSignature === params.razorpaySignature;
}

export function verifyWebhookSignature(
  body: string,
  signature: string
): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");
  return expectedSignature === signature;
}

export async function fetchRazorpayPayment(paymentId: string) {
  return razorpayRequest(`/payments/${paymentId}`, "GET");
}

export async function capturePayment(paymentId: string, amount: number) {
  return razorpayRequest(`/payments/${paymentId}/capture`, "POST", {
    amount: Math.round(amount * 100),
    currency: "INR",
  });
}

export async function refundPayment(paymentId: string, amount?: number) {
  const body: Record<string, any> = {};
  if (amount) body.amount = Math.round(amount * 100);
  return razorpayRequest(`/payments/${paymentId}/refund`, "POST", body);
}
