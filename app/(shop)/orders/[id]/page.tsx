export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { CheckCircle, Package, MapPin, Download } from "lucide-react";
import ReviewForm from "@/components/product/ReviewForm";
import CancelOrderButton from "@/components/profile/CancelOrderButton";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-gray-100 text-gray-700",
};

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string }>;
}) {
  const session = await requireAuth().catch(() => null);
  if (!session) notFound();

  const { id } = await params;
  const { success } = await searchParams;

  const order = await prisma.order.findFirst({
    where: { id, userId: session.userId },
    include: {
      items: {
        select: {
          id: true, productId: true, name: true,
          variantName: true, quantity: true, total: true, imageUrl: true,
        },
      },
      address: true,
      payment: true,
    },
  });

  if (!order) notFound();

  const cancellable = ["PENDING", "CONFIRMED", "PROCESSING"].includes(order.status);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 mb-8 text-center">
              <CheckCircle size={48} className="text-green-500 mx-auto mb-3" />
              <h1 className="font-display text-3xl font-light text-green-800 mb-1">Order Placed!</h1>
              <p className="font-body text-sm text-green-600">
                Thank you for your order. You'll receive a confirmation shortly.
              </p>
            </div>
          )}

          <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
            {/* Order header */}
            <div className="p-6 border-b border-charcoal-100">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <p className="font-body text-xs text-charcoal-400 mb-1">Order Number</p>
                  <p className="font-body text-lg font-semibold text-charcoal-900">{order.orderNumber}</p>
                  <p className="font-body text-xs text-charcoal-400 mt-1">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`badge text-xs font-semibold py-1.5 px-3 ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-700"}`}>
                    {order.status}
                  </span>
                  <a
                    href={`/api/invoice/${order.id}`}
                    download={`invoice-${order.orderNumber}.pdf`}
                    className="flex items-center gap-1.5 font-body text-sm text-brand-600 hover:text-brand-700"
                  >
                    <Download size={14} /> Invoice
                  </a>
                  {cancellable && <CancelOrderButton orderId={order.id} />}
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="p-6 border-b border-charcoal-100">
              <h2 className="font-body text-sm font-semibold text-charcoal-600 mb-4 flex items-center gap-2">
                <Package size={16} /> Order Items
              </h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-16 bg-cream-100 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
                        {item.imageUrl
                          ? <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                          : <span className="text-charcoal-300 text-xl">✦</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm font-medium text-charcoal-800 line-clamp-1">{item.name}</p>
                        <p className="font-body text-xs text-charcoal-400">{item.variantName} × {item.quantity}</p>
                      </div>
                      <p className="font-body text-sm font-semibold text-charcoal-900 shrink-0">
                        ₹{item.total.toLocaleString("en-IN")}
                      </p>
                    </div>
                    {order.status === "DELIVERED" && (
                      <ReviewForm productId={item.productId} productName={item.name} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Address */}
            {order.address && (
              <div className="p-6 border-b border-charcoal-100">
                <h2 className="font-body text-sm font-semibold text-charcoal-600 mb-3 flex items-center gap-2">
                  <MapPin size={16} /> Delivery Address
                </h2>
                <div className="font-body text-sm text-charcoal-700 space-y-0.5">
                  <p className="font-semibold">{order.address.name}</p>
                  <p>{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ""}</p>
                  <p>{order.address.city}, {order.address.state} - {order.address.pincode}</p>
                  <p className="text-charcoal-500">📞 {order.address.phone}</p>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="p-6">
              <div className="space-y-2 text-sm font-body max-w-xs ml-auto">
                <div className="flex justify-between text-charcoal-600"><span>Subtotal</span><span>₹{order.subtotal.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between text-charcoal-600"><span>GST</span><span>₹{order.gstAmount.toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between text-charcoal-600">
                  <span>Shipping</span>
                  <span>{order.shippingAmount === 0 ? "FREE" : `₹${order.shippingAmount}`}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-₹{order.discountAmount.toLocaleString("en-IN")}</span>
                  </div>
                )}
                <div className="flex justify-between font-semibold text-charcoal-900 text-base border-t border-charcoal-100 pt-2">
                  <span>Total</span>
                  <span>₹{order.total.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex justify-between text-charcoal-500 text-xs mt-1">
                  <span>Payment</span>
                  <span className="flex items-center gap-1.5">
                    {order.paymentMethod}
                    <span className={`badge text-[10px] ${order.paymentStatus === "PAID" ? "badge-green" : "badge-gray"}`}>
                      {order.paymentStatus}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <Link href="/orders" className="btn-outline flex-1 text-center">All Orders</Link>
            <Link href="/products" className="btn-primary flex-1 text-center">Continue Shopping</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
