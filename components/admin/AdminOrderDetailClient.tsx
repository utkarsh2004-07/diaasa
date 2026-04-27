"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Download, Truck, ExternalLink } from "lucide-react";

const STATUSES = ["PENDING","CONFIRMED","PROCESSING","SHIPPED","DELIVERED","CANCELLED"];

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-gray-100 text-gray-700",
};

interface Order {
  id: string; orderNumber: string; status: string;
  paymentMethod: string; paymentStatus: string;
  subtotal: number; gstAmount: number; shippingAmount: number;
  discountAmount: number; total: number;
  couponCode?: string | null; notes?: string | null;
  createdAt: Date; invoiceUrl?: string | null;
  razorpayPaymentId?: string | null;
  shiprocketOrderId?: string | null;
  awbCode?: string | null;
  trackingUrl?: string | null;
  user: { id: string; name?: string | null; phone: string; email?: string | null };
  address?: { name: string; line1: string; line2?: string | null; city: string; state: string; pincode: string; phone: string } | null;
  items: Array<{ id: string; name: string; variantName: string; quantity: number; price: number; gstAmount: number; total: number; imageUrl?: string | null }>;
  payment?: { status: string; razorpayPaymentId?: string | null; method?: string | null } | null;
}

export default function AdminOrderDetailClient({ order: initial }: { order: Order }) {
  const [order, setOrder] = useState(initial);
  const [updating, setUpdating] = useState(false);
  const [updatingPayment, setUpdatingPayment] = useState(false);
  const [shipping, setShipping] = useState(false);
  const [srStatus, setSrStatus] = useState<null | { awb: string; status: string; courier: string; etd: string; city: string }>(null);
  const [checkingSr, setCheckingSr] = useState(false);
  const router = useRouter();

  const updateStatus = async (status: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder((o) => ({ ...o, status }));
        toast.success("Order status updated");
        router.refresh();
      } else toast.error(typeof data.error === "string" ? data.error : data.error?.message || "Failed");
    } finally { setUpdating(false); }
  };

  const updatePaymentStatus = async (paymentStatus: string) => {
    setUpdatingPayment(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/payment-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrder((o) => ({ ...o, paymentStatus }));
        toast.success("Payment status updated");
        router.refresh();
      } else toast.error(typeof data.error === "string" ? data.error : data.error?.message || "Failed");
    } finally { setUpdatingPayment(false); }
  };

  const handleShiprocket = async () => {
    if (!confirm("Create shipment on Shiprocket and mark as SHIPPED?")) return;
    setShipping(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/shiprocket`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setOrder((o) => ({
          ...o,
          status: "SHIPPED",
          shiprocketOrderId: data.data?.shiprocketOrderId,
          awbCode: data.data?.awbCode || null,
          trackingUrl: data.data?.trackingUrl || null,
        }));
        toast.success(typeof data.message === "string" ? data.message : "Shipped via Shiprocket!");
      } else {
        const errMsg = typeof data.error === "string" ? data.error : data.error?.message || "Shiprocket failed";
        toast.error(errMsg);
      }
    } finally { setShipping(false); }
  };

  const canShip = (!order.shiprocketOrderId || order.shiprocketOrderId === "undefined") && ["CONFIRMED", "PROCESSING"].includes(order.status);

  const checkSrStatus = async () => {
    setCheckingSr(true);
    setSrStatus(null);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/shiprocket-status`);
      const data = await res.json();
      if (data.success) {
        const d = data.data;
        if (d?.awb && !order.awbCode) {
          setOrder((o) => ({ ...o, awbCode: d.awb, trackingUrl: `https://shiprocket.co/tracking/${d.awb}` }));
        }
        setSrStatus(d);
        toast.success("Shiprocket status fetched!");
      } else {
        const errMsg = typeof data.error === "string" ? data.error : data.error?.message || "Could not fetch status";
        toast.error(errMsg);
      }
    } finally { setCheckingSr(false); }
  };

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-body text-2xl font-semibold text-charcoal-900">{order.orderNumber}</h1>
          <p className="font-body text-sm text-charcoal-400">{new Date(order.createdAt).toLocaleString("en-IN")}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`badge py-1.5 px-3 font-semibold ${STATUS_COLORS[order.status] || ""}`}>{order.status}</span>

          <a
            href={`/api/invoice/${order.id}`}
            download={`invoice-${order.orderNumber}.pdf`}
            className="btn-outline text-sm py-2 flex items-center gap-1.5"
          >
            <Download size={14} /> Invoice
          </a>

          {canShip && (
            <button
              onClick={handleShiprocket}
              disabled={shipping}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 font-body text-sm font-medium transition-all disabled:opacity-50"
            >
              <Truck size={14} />
              {shipping ? "Creating..." : "Ship via Shiprocket"}
            </button>
          )}

          {order.shiprocketOrderId && (
            <button
              onClick={checkSrStatus}
              disabled={checkingSr}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 font-body text-sm font-medium transition-all disabled:opacity-50"
            >
              <Truck size={14} />
              {checkingSr ? "Checking..." : "Check Shiprocket Status"}
            </button>
          )}

          {order.awbCode && (
            <a
              href={order.trackingUrl || `https://shiprocket.co/tracking/${order.awbCode}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 font-body text-sm font-medium transition-all"
            >
              <ExternalLink size={14} /> AWB: {order.awbCode}
            </a>
          )}
        </div>
      </div>

      {/* Shiprocket live status card */}
      {srStatus && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5 space-y-3">
          <h2 className="font-body text-sm font-semibold text-indigo-800">📦 Shiprocket Live Status</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl p-3">
              <p className="font-body text-[10px] text-charcoal-400 uppercase tracking-wide mb-1">AWB Code</p>
              <p className="font-body text-sm font-semibold text-charcoal-900">{srStatus.awb || "Not assigned yet"}</p>
            </div>
            <div className="bg-white rounded-xl p-3">
              <p className="font-body text-[10px] text-charcoal-400 uppercase tracking-wide mb-1">Status</p>
              <p className="font-body text-sm font-semibold text-indigo-700">{srStatus.status || "—"}</p>
            </div>
            <div className="bg-white rounded-xl p-3">
              <p className="font-body text-[10px] text-charcoal-400 uppercase tracking-wide mb-1">Courier</p>
              <p className="font-body text-sm font-semibold text-charcoal-900">{srStatus.courier || "—"}</p>
            </div>
            <div className="bg-white rounded-xl p-3">
              <p className="font-body text-[10px] text-charcoal-400 uppercase tracking-wide mb-1">City</p>
              <p className="font-body text-sm font-semibold text-charcoal-900">{srStatus.city || "—"}</p>
            </div>
          </div>
          {srStatus.awb && (
            <a
              href={`https://shiprocket.co/tracking/${srStatus.awb}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-body text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <ExternalLink size={13} /> Track on Shiprocket →
            </a>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {/* Status update */}
        <div className="bg-white rounded-2xl p-5 shadow-soft border border-charcoal-50">
          <h2 className="font-body text-sm font-semibold text-charcoal-700 mb-4">Update Status</h2>
          <div className="grid grid-cols-3 gap-2">
            {STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => updateStatus(s)}
                disabled={updating || order.status === s}
                className={`py-2 rounded-xl text-xs font-body font-medium transition-all ${
                  order.status === s
                    ? "bg-brand-500 text-white"
                    : "border border-charcoal-200 text-charcoal-600 hover:border-brand-400 hover:text-brand-600"
                } disabled:opacity-50`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Payment Status (COD only) */}
        {order.paymentMethod === "COD" && (
          <div className="bg-white rounded-2xl p-5 shadow-soft border border-charcoal-50">
            <h2 className="font-body text-sm font-semibold text-charcoal-700 mb-4">Payment Status</h2>
            <div className="flex gap-2">
              <button
                onClick={() => updatePaymentStatus("PENDING")}
                disabled={updatingPayment || order.paymentStatus === "PENDING"}
                className={`py-2 px-3 rounded-xl text-xs font-body font-medium transition-all ${
                  order.paymentStatus === "PENDING"
                    ? "bg-yellow-500 text-white"
                    : "border border-charcoal-200 text-charcoal-600 hover:border-yellow-400 hover:text-yellow-600"
                } disabled:opacity-50`}
              >
                PENDING
              </button>
              <button
                onClick={() => updatePaymentStatus("PAID")}
                disabled={updatingPayment || order.paymentStatus === "PAID"}
                className={`py-2 px-3 rounded-xl text-xs font-body font-medium transition-all ${
                  order.paymentStatus === "PAID"
                    ? "bg-green-500 text-white"
                    : "border border-charcoal-200 text-charcoal-600 hover:border-green-400 hover:text-green-600"
                } disabled:opacity-50`}
              >
                PAID
              </button>
            </div>
          </div>
        )}

        {/* Customer */}
        <div className="bg-white rounded-2xl p-5 shadow-soft border border-charcoal-50">
          <h2 className="font-body text-sm font-semibold text-charcoal-700 mb-3">Customer</h2>
          <div className="font-body text-sm space-y-1">
            <p className="font-semibold text-charcoal-800">{order.user.name || "—"}</p>
            <p className="text-charcoal-600">📞 {order.user.phone}</p>
            {order.user.email && <p className="text-charcoal-600">✉️ {order.user.email}</p>}
          </div>
          {order.address && (
            <div className="mt-3 pt-3 border-t border-charcoal-100 font-body text-sm text-charcoal-600">
              <p>{order.address.name}</p>
              <p>{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ""}</p>
              <p>{order.address.city}, {order.address.state} - {order.address.pincode}</p>
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl shadow-soft border border-charcoal-50 overflow-hidden">
        <div className="px-5 py-4 border-b border-charcoal-50">
          <h2 className="font-body text-sm font-semibold text-charcoal-700">Order Items</h2>
        </div>
        <div className="divide-y divide-charcoal-50">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 px-5 py-4">
              <div className="w-12 h-14 bg-cream-100 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                {item.imageUrl ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-charcoal-300">✦</span>}
              </div>
              <div className="flex-1">
                <p className="font-body text-sm font-medium text-charcoal-800">{item.name}</p>
                <p className="font-body text-xs text-charcoal-400">{item.variantName} × {item.quantity}</p>
              </div>
              <div className="text-right font-body text-sm">
                <p className="font-semibold text-charcoal-900">₹{item.total.toLocaleString("en-IN")}</p>
                <p className="text-xs text-charcoal-400">GST: ₹{item.gstAmount.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="px-5 py-4 border-t border-charcoal-100 space-y-2 font-body text-sm">
          <div className="flex justify-between text-charcoal-600"><span>Subtotal</span><span>₹{order.subtotal.toLocaleString("en-IN")}</span></div>
          <div className="flex justify-between text-charcoal-600"><span>GST</span><span>₹{order.gstAmount.toLocaleString("en-IN")}</span></div>
          <div className="flex justify-between text-charcoal-600"><span>Shipping</span><span>{order.shippingAmount === 0 ? "FREE" : `₹${order.shippingAmount}`}</span></div>
          {order.discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Discount {order.couponCode && `(${order.couponCode})`}</span><span>-₹{order.discountAmount}</span></div>}
          <div className="flex justify-between font-semibold text-charcoal-900 text-base pt-2 border-t border-charcoal-100">
            <span>Total</span><span>₹{order.total.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between text-charcoal-500 text-xs">
            <span>Payment: {order.paymentMethod}</span>
            <span className={`badge text-[11px] ${order.paymentStatus === "PAID" ? "badge-green" : "badge-gray"}`}>{order.paymentStatus}</span>
          </div>
          {order.razorpayPaymentId && (
            <p className="text-xs text-charcoal-400">Razorpay ID: {order.razorpayPaymentId}</p>
          )}
        </div>
      </div>
    </div>
  );
}
