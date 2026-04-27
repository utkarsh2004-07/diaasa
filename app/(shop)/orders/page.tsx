import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Package, ChevronRight } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default async function OrdersPage() {
  const user = await getAuthUser();
  if (!user) redirect("/login?redirect=/orders");

  const orders = await prisma.order.findMany({
    where: {
      userId: user.id,
      // Hide abandoned online payment orders (PENDING = user never paid)
      NOT: { status: "PENDING", paymentMethod: "ONLINE" },
    },
    include: {
      items: { take: 2 },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="font-display text-4xl font-light text-charcoal-900 mb-8">My Orders</h1>

          {orders.length === 0 ? (
            <div className="text-center py-24">
              <Package size={60} className="text-charcoal-200 mx-auto mb-5" />
              <h2 className="font-display text-3xl font-light text-charcoal-600 mb-3">No orders yet</h2>
              <p className="font-body text-sm text-charcoal-400 mb-8">
                When you place an order, it will appear here.
              </p>
              <Link href="/products" className="btn-primary">Start Shopping</Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="bg-white rounded-2xl p-5 shadow-soft flex items-center gap-4 hover:shadow-medium transition-all hover:-translate-y-0.5 block"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <p className="font-body text-sm font-semibold text-charcoal-900">
                        {order.orderNumber}
                      </p>
                      <span className={`badge text-[11px] font-semibold ${STATUS_COLORS[order.status] || "badge-gray"}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="font-body text-xs text-charcoal-400 mb-1">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "long", year: "numeric",
                      })}
                    </p>
                    <p className="font-body text-xs text-charcoal-500 truncate">
                      {order.items.map((i) => i.name).join(", ")}
                      {order.items.length > 2 && ` +${order.items.length - 2} more`}
                    </p>
                  </div>
                  <div className="text-right shrink-0 flex items-center gap-3">
                    <div>
                      <p className="font-body text-base font-semibold text-charcoal-900">
                        ₹{order.total.toLocaleString("en-IN")}
                      </p>
                      <p className="font-body text-xs text-charcoal-400">
                        {order.paymentMethod}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-charcoal-300" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
