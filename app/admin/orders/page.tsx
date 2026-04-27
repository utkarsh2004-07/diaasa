import { prisma } from "@/lib/prisma";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; q?: string }>;
}) {
  const { page = "1", status, q } = await searchParams;
  const pg = Math.max(1, Number(page));
  const limit = 20;

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (q) {
    where.OR = [
      { orderNumber: { contains: q } },
      { user: { phone: { contains: q } } },
      { user: { name: { contains: q } } },
    ];
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { user: { select: { name: true, phone: true } } },
      orderBy: { createdAt: "desc" },
      skip: (pg - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-body text-2xl font-semibold text-charcoal-900">Orders</h1>
        <span className="font-body text-sm text-charcoal-400">{total} total</span>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 flex flex-wrap gap-3 shadow-soft border border-charcoal-50">
        <form className="flex gap-3 flex-wrap w-full">
          <input name="q" defaultValue={q} placeholder="Search order, phone…"
            className="input-base max-w-xs py-2 text-sm" />
          <select name="status" defaultValue={status || ""}
            className="input-base w-40 py-2 text-sm">
            <option value="">All Status</option>
            {["PENDING","CONFIRMED","PROCESSING","SHIPPED","DELIVERED","CANCELLED"].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button type="submit" className="btn-primary py-2 px-4 text-sm">Filter</button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-soft border border-charcoal-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-body">
            <thead>
              <tr className="bg-charcoal-50 text-charcoal-500 text-xs uppercase tracking-wider">
                <th className="text-left px-5 py-3">Order</th>
                <th className="text-left px-5 py-3">Customer</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Payment</th>
                <th className="text-right px-5 py-3">Total</th>
                <th className="text-left px-5 py-3">Date</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-charcoal-50">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-cream-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium">{order.orderNumber}</td>
                  <td className="px-5 py-3.5 text-charcoal-700">{order.user.name || order.user.phone}</td>
                  <td className="px-5 py-3.5">
                    <span className={`badge text-[11px] font-semibold ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-700"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`badge text-[11px] ${order.paymentStatus === "PAID" ? "badge-green" : "badge-gray"}`}>
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold">
                    ₹{order.total.toLocaleString("en-IN")}
                  </td>
                  <td className="px-5 py-3.5 text-charcoal-400 text-xs">
                    {new Date(order.createdAt).toLocaleDateString("en-IN")}
                  </td>
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/orders/${order.id}`}
                      className="font-body text-xs text-brand-600 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > limit && (
          <div className="flex justify-center gap-2 p-4 border-t border-charcoal-50">
            {Array.from({ length: Math.ceil(total / limit) }, (_, i) => (
              <Link
                key={i}
                href={`?page=${i + 1}${status ? `&status=${status}` : ""}${q ? `&q=${q}` : ""}`}
                className={`w-8 h-8 flex items-center justify-center rounded-full text-xs font-body transition-all ${
                  pg === i + 1 ? "bg-brand-500 text-white" : "border border-charcoal-200 text-charcoal-600 hover:border-brand-400"
                }`}
              >
                {i + 1}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
