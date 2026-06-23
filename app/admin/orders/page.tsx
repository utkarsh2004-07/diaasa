export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  PROCESSING: "bg-purple-100 text-purple-700",
  SHIPPED: "bg-indigo-100 text-indigo-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

// Hide failed online payments — only show COD orders + paid online orders
const VALID_FILTER: Prisma.OrderWhereInput = {
  OR: [
    { paymentMethod: "COD" },
    { paymentMethod: "ONLINE", paymentStatus: "PAID" },
  ],
};

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; status?: string; q?: string; page?: string }>;
}) {
  const { tab = "pending", status, q, page = "1" } = await searchParams;
  const pg = Math.max(1, Number(page));
  const limit = 20;

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 6);

  const searchFilter: Prisma.OrderWhereInput = q
    ? {
        OR: [
          { orderNumber: { contains: q } },
          { user: { phone: { contains: q } } },
          { user: { name: { contains: q } } },
        ],
      }
    : {};

  const buildWhere = (): Prisma.OrderWhereInput => {
    if (tab === "pending") {
      return { AND: [VALID_FILTER, { status: { in: ["PENDING", "CONFIRMED"] } }, searchFilter] };
    }
    if (tab === "today") {
      return { AND: [VALID_FILTER, { createdAt: { gte: todayStart } }, searchFilter] };
    }
    if (tab === "yesterday") {
      return { AND: [VALID_FILTER, { createdAt: { gte: yesterdayStart, lt: todayStart } }, searchFilter] };
    }
    if (tab === "week") {
      return { AND: [VALID_FILTER, { createdAt: { gte: weekStart } }, searchFilter] };
    }
    // "all" tab
    const extra: Prisma.OrderWhereInput = status ? { status: status as Prisma.EnumOrderStatusFilter } : {};
    return { AND: [VALID_FILTER, extra, searchFilter] };
  };

  const where = buildWhere();

  const [pendingCount, todayCount, yesterdayCount, weekCount, allCount, orders, total] =
    await Promise.all([
      prisma.order.count({ where: { AND: [VALID_FILTER, { status: { in: ["PENDING", "CONFIRMED"] } }] } }),
      prisma.order.count({ where: { AND: [VALID_FILTER, { createdAt: { gte: todayStart } }] } }),
      prisma.order.count({ where: { AND: [VALID_FILTER, { createdAt: { gte: yesterdayStart, lt: todayStart } }] } }),
      prisma.order.count({ where: { AND: [VALID_FILTER, { createdAt: { gte: weekStart } }] } }),
      prisma.order.count({ where: VALID_FILTER }),
      prisma.order.findMany({
        where,
        include: { user: { select: { name: true, phone: true } } },
        orderBy: { createdAt: "desc" },
        skip: (pg - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

  const tabs = [
    { key: "pending", label: "Needs Action", count: pendingCount, active: "text-orange-600 border-orange-500 bg-orange-50" },
    { key: "today",   label: "Today",        count: todayCount,   active: "text-blue-600 border-blue-500 bg-blue-50" },
    { key: "yesterday", label: "Yesterday",  count: yesterdayCount, active: "text-purple-600 border-purple-500 bg-purple-50" },
    { key: "week",    label: "This Week",    count: weekCount,    active: "text-green-600 border-green-500 bg-green-50" },
    { key: "all",     label: "All Orders",   count: allCount,     active: "text-charcoal-700 border-charcoal-500 bg-charcoal-50" },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-body text-2xl font-semibold text-charcoal-900">Orders</h1>
        <span className="font-body text-sm text-charcoal-400">{total} shown</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`?tab=${t.key}`}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-body text-sm font-medium border-2 transition-all ${
              tab === t.key
                ? t.active
                : "border-charcoal-100 text-charcoal-500 bg-white hover:border-charcoal-300"
            }`}
          >
            {t.label}
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
              tab === t.key ? "bg-white/70" : "bg-charcoal-100 text-charcoal-500"
            }`}>
              {t.count}
            </span>
          </Link>
        ))}
      </div>

      {/* Helper banner for pending tab */}
      {tab === "pending" && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 font-body text-sm text-orange-700">
          ⚡ Showing only <strong>PENDING</strong> &amp; <strong>CONFIRMED</strong> orders that need to be dispatched. Failed payments are hidden.
        </div>
      )}

      {/* Search + status filter */}
      <div className="bg-white rounded-xl p-4 flex flex-wrap gap-3 shadow-soft border border-charcoal-50">
        <form className="flex gap-3 flex-wrap w-full">
          <input type="hidden" name="tab" value={tab} />
          <input name="q" defaultValue={q} placeholder="Search order, phone…"
            className="input-base max-w-xs py-2 text-sm" />
          {tab === "all" && (
            <select name="status" defaultValue={status || ""} className="input-base w-40 py-2 text-sm">
              <option value="">All Status</option>
              {["PENDING","CONFIRMED","PROCESSING","SHIPPED","DELIVERED","CANCELLED"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
          <button type="submit" className="btn-primary py-2 px-4 text-sm">Search</button>
        </form>
      </div>

      {/* Table */}
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
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center font-body text-sm text-charcoal-400">
                    No orders found
                  </td>
                </tr>
              )}
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-cream-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium">{order.orderNumber}</td>
                  <td className="px-5 py-3.5 text-charcoal-700">
                    {order.user.name || order.user.phone}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`badge text-[11px] font-semibold ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-700"}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`badge text-[11px] ${order.paymentStatus === "PAID" ? "badge-green" : "badge-gray"}`}>
                      {order.paymentMethod === "COD" ? "COD" : order.paymentStatus}
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

        {total > limit && (
          <div className="flex justify-center gap-2 p-4 border-t border-charcoal-50">
            {Array.from({ length: Math.ceil(total / limit) }, (_, i) => (
              <Link
                key={i}
                href={`?tab=${tab}&page=${i + 1}${status ? `&status=${status}` : ""}${q ? `&q=${q}` : ""}`}
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
