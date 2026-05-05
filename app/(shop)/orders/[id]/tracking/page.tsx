import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Package, CheckCircle, Truck, MapPin, Clock, ArrowLeft } from "lucide-react";

const STEPS = [
  { status: "CONFIRMED",   label: "Order Confirmed",  icon: CheckCircle, desc: "Your order has been confirmed" },
  { status: "PROCESSING",  label: "Processing",        icon: Package,     desc: "We are preparing your order" },
  { status: "SHIPPED",     label: "Shipped",           icon: Truck,       desc: "Your order is on the way" },
  { status: "DELIVERED",   label: "Delivered",         icon: MapPin,      desc: "Order delivered successfully" },
];

const STATUS_ORDER = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireAuth().catch(() => null);
  if (!session) notFound();

  const { id } = await params;

  const order = await prisma.order.findFirst({
    where: { id, userId: session.userId },
    select: {
      id: true, orderNumber: true, status: true, createdAt: true,
      cancelReason: true, notes: true, awbCode: true, trackingUrl: true,
      items: { take: 3, select: { name: true } },
      address: true,
    },
  });

  if (!order) notFound();

  const currentStepIndex = STATUS_ORDER.indexOf(order.status);
  const isCancelled = order.status === "CANCELLED";

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Link href={`/orders/${id}`} className="inline-flex items-center gap-2 font-body text-sm text-charcoal-500 hover:text-charcoal-800 mb-6 transition-colors">
            <ArrowLeft size={16} /> Back to Order
          </Link>

          <div className="bg-white rounded-2xl shadow-soft overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-charcoal-100">
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <p className="font-body text-xs text-charcoal-400 mb-1">Tracking Order</p>
                  <p className="font-body text-lg font-semibold text-charcoal-900">{order.orderNumber}</p>
                  <p className="font-body text-xs text-charcoal-400 mt-1">
                    Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                  </p>
                </div>
                {isCancelled ? (
                  <span className="badge bg-red-100 text-red-700 py-1.5 px-3 font-semibold text-xs">CANCELLED</span>
                ) : (
                  <span className="badge bg-blue-100 text-blue-700 py-1.5 px-3 font-semibold text-xs">{order.status}</span>
                )}
              </div>
            </div>

            {/* Timeline */}
            <div className="p-6">
              {isCancelled ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">✕</span>
                  </div>
                  <p className="font-body text-base font-medium text-charcoal-800">Order Cancelled</p>
                  {order.cancelReason && (
                    <p className="font-body text-sm text-charcoal-500 mt-2">{order.cancelReason}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-0">
                  {STEPS.map((step, index) => {
                    const stepIndex = STATUS_ORDER.indexOf(step.status);
                    const isCompleted = currentStepIndex >= stepIndex;
                    const isCurrent = STATUS_ORDER[currentStepIndex] === step.status;
                    const Icon = step.icon;

                    return (
                      <div key={step.status} className="flex gap-4">
                        {/* Icon + line */}
                        <div className="flex flex-col items-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                            isCompleted
                              ? "bg-brand-500 text-white shadow-brand"
                              : "bg-cream-100 text-charcoal-300"
                          } ${isCurrent ? "ring-4 ring-brand-100" : ""}`}>
                            <Icon size={18} />
                          </div>
                          {index < STEPS.length - 1 && (
                            <div className={`w-0.5 h-12 mt-1 transition-all ${isCompleted && currentStepIndex > stepIndex ? "bg-brand-400" : "bg-cream-200"}`} />
                          )}
                        </div>

                        {/* Content */}
                        <div className="pb-10 flex-1">
                          <p className={`font-body text-sm font-semibold ${isCompleted ? "text-charcoal-900" : "text-charcoal-400"}`}>
                            {step.label}
                            {isCurrent && <span className="ml-2 text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">Current</span>}
                          </p>
                          <p className={`font-body text-xs mt-0.5 ${isCompleted ? "text-charcoal-500" : "text-charcoal-300"}`}>
                            {step.desc}
                          </p>
                          {/* Shiprocket tracking placeholder */}
                          {step.status === "SHIPPED" && isCompleted && (
                            <div className="mt-2 p-3 bg-blue-50 rounded-xl">
                              <p className="font-body text-xs text-blue-700 font-medium flex items-center gap-1.5">
                                <Truck size={12} />
                                {(order as any).awbCode
                                  ? `AWB: ${(order as any).awbCode}`
                                  : "Tracking details will appear here once available"}
                              </p>
                              {(order as any).trackingUrl && (
                                <a
                                  href={(order as any).trackingUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-body text-xs text-blue-600 underline mt-1 block"
                                >
                                  Track on Shiprocket →
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Delivery address */}
            {order.address && (
              <div className="px-6 pb-6">
                <div className="bg-cream-50 rounded-xl p-4">
                  <p className="font-body text-xs font-semibold text-charcoal-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <MapPin size={12} /> Delivery Address
                  </p>
                  <p className="font-body text-sm text-charcoal-700">{order.address.name}</p>
                  <p className="font-body text-sm text-charcoal-600">{order.address.line1}{order.address.line2 ? `, ${order.address.line2}` : ""}</p>
                  <p className="font-body text-sm text-charcoal-600">{order.address.city}, {order.address.state} — {order.address.pincode}</p>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3 mt-6">
            <Link href="/orders" className="btn-outline flex-1 text-center text-sm">All Orders</Link>
            <Link href="/products" className="btn-primary flex-1 text-center text-sm">Continue Shopping</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
