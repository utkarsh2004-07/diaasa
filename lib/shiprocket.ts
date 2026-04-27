const SHIPROCKET_API = "https://apiv2.shiprocket.in/v1/external";
const SHIPROCKET_EMAIL = process.env.SHIPROCKET_EMAIL || "utkarshsingh5005000@gmail.com";
const SHIPROCKET_PASSWORD = "DtrLLH4$v36Ixv*U8SUalQOL!b@Wuk04";

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const email = SHIPROCKET_EMAIL;
  const password = SHIPROCKET_PASSWORD;

  if (!email || !password) throw new Error("Shiprocket credentials not set");

  const res = await fetch(`${SHIPROCKET_API}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    cache: "no-store",
  });

  const data = await res.json();
  if (!res.ok || !data.token) {
    // reset cache so next call retries
    cachedToken = null;
    tokenExpiry = 0;
    throw new Error(data.message || "Shiprocket auth failed");
  }

  cachedToken = data.token;
  tokenExpiry = Date.now() + 9 * 24 * 60 * 60 * 1000;
  return cachedToken!;
}

async function shiprocketRequest(endpoint: string, method: string, body?: object) {
  const token = await getToken();
  const res = await fetch(`${SHIPROCKET_API}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Shiprocket API error");
  return data;
}

export interface ShiprocketOrderParams {
  orderId: string;
  orderNumber: string;
  orderDate: Date;
  customer: { name: string; phone: string; email?: string };
  address: { line1: string; line2?: string; city: string; state: string; pincode: string };
  items: Array<{ name: string; sku: string; quantity: number; price: number; weight?: number }>;
  subtotal: number;
  paymentMethod: "COD" | "ONLINE";
  total: number;
}

export async function createShiprocketOrder(params: ShiprocketOrderParams) {
  const orderItems = params.items.map((item) => ({
    name: item.name,
    sku: item.sku || item.name.replace(/\s+/g, "-").toLowerCase(),
    units: item.quantity,
    selling_price: item.price,
    discount: 0,
    tax: 0,
    hsn: "",
  }));

  const body = {
    order_id: params.orderNumber,
    order_date: params.orderDate.toISOString().split("T")[0],
    pickup_location: process.env.SHIPROCKET_PICKUP_LOCATION || "Primary",
    channel_id: "",
    comment: "",
    billing_customer_name: params.customer.name,
    billing_last_name: "",
    billing_address: params.address.line1,
    billing_address_2: params.address.line2 || "",
    billing_city: params.address.city,
    billing_pincode: params.address.pincode,
    billing_state: params.address.state,
    billing_country: "India",
    billing_email: params.customer.email || "",
    billing_phone: params.customer.phone,
    shipping_is_billing: true,
    order_items: orderItems,
    payment_method: params.paymentMethod === "COD" ? "COD" : "Prepaid",
    sub_total: params.subtotal,
    length: 10,
    breadth: 10,
    height: 10,
    weight: 0.5,
  };

  return shiprocketRequest("/orders/create/adhoc", "POST", body);
}

export async function assignAWB(shipmentId: number, courierCode?: number) {
  return shiprocketRequest("/courier/assign/awb", "POST", {
    shipment_id: shipmentId,
    courier_id: courierCode,
  });
}

export async function generatePickup(shipmentIds: number[]) {
  return shiprocketRequest("/courier/generate/pickup", "POST", {
    shipment_id: shipmentIds,
  });
}

export async function generateLabel(shipmentIds: number[]) {
  return shiprocketRequest("/courier/generate/label", "POST", {
    shipment_id: shipmentIds,
  });
}

export async function trackShipment(awbCode: string) {
  return shiprocketRequest(`/courier/track/awb/${awbCode}`, "GET");
}

export async function trackByOrderId(orderId: string) {
  return shiprocketRequest(`/orders/show/${orderId}`, "GET");
}

export async function cancelShiprocketOrder(ids: number[]) {
  return shiprocketRequest("/orders/cancel", "POST", { ids });
}

export async function getAvailableCouriers(pincode: string, weight = 0.5) {
  return shiprocketRequest(
    `/courier/serviceability/?pickup_postcode=${process.env.SHIPROCKET_PICKUP_PINCODE || "400001"}&delivery_postcode=${pincode}&weight=${weight}&cod=0`,
    "GET"
  );
}
