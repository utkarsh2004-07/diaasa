export const dynamic = "force-dynamic";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { TAGS } from "@/lib/cache";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";

const getDashboardData = unstable_cache(
  async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 6);
    weekAgo.setHours(0, 0, 0, 0);

    const VALID = {
      OR: [
        { paymentMethod: "COD" as const },
        { paymentMethod: "ONLINE" as const, paymentStatus: "PAID" as const },
      ],
    };

    // 7 queries instead of 12 — all parallel
    const [
      // 1. order counts for all + thisMonth + lastMonth in one shot
      orderRows,
      // 2. revenue total + thisMonth in one shot
      revenueRows,
      // 3. daily sales grouped in DB — no JS filtering
      dailySalesRaw,
      // 4-7. unchanged
      totalUsers,
      newUsers,
      totalProducts,
      lowStockCount,
      pendingReviews,
      recentOrders,
    ] = await Promise.all([
      prisma.order.findMany({
        where: { AND: [VALID, { status: { notIn: ["CANCELLED"] } }, { createdAt: { gte: startOfLastMonth } }] },
        select: { createdAt: true },
      }),
      prisma.order.findMany({
        where: { paymentStatus: "PAID" },
        select: { total: true, createdAt: true },
      }),
      prisma.$queryRaw<{ day: string; revenue: number; orders: bigint }[]>`
        SELECT
          DATE(createdAt)  AS day,
          SUM(total)       AS revenue,
          COUNT(*)         AS orders
        FROM orders
        WHERE paymentStatus = 'PAID'
          AND createdAt >= ${weekAgo}
        GROUP BY DATE(createdAt)
        ORDER BY day ASC
      `,
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.productVariant.count({ where: { stock: { lte: 5 }, isActive: true } }),
      prisma.review.count({ where: { status: "PENDING" } }),
      prisma.order.findMany({
        where: VALID,
        select: {
          id: true, orderNumber: true, status: true,
          total: true, createdAt: true,
          user: { select: { name: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    // derive counts from single fetch
    const totalOrders = orderRows.length;
    const monthOrders = orderRows.filter((r) => r.createdAt >= startOfMonth).length;
    const lastMonthOrders = orderRows.filter((r) => r.createdAt >= startOfLastMonth && r.createdAt < startOfMonth).length;

    // derive revenue from single fetch
    const totalRevenue = revenueRows.reduce((s, r) => s + r.total, 0);
    const monthRevenue = revenueRows.filter((r) => r.createdAt >= startOfMonth).reduce((s, r) => s + r.total, 0);

    // build 7-day chart — DB already grouped, just fill missing days
    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const dailySales = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dayStr = d.toISOString().slice(0, 10);
      const row = dailySalesRaw.find((r) => r.day === dayStr);
      return {
        date: `${d.getDate()} ${MONTHS[d.getMonth()]}`,
        revenue: row ? Number(row.revenue) : 0,
        orders: row ? Number(row.orders) : 0,
      };
    });

    return {
      stats: {
        totalOrders, monthOrders,
        orderGrowth: lastMonthOrders
          ? Math.round(((monthOrders - lastMonthOrders) / lastMonthOrders) * 100)
          : 100,
        totalRevenue,
        monthRevenue,
        totalUsers, newUsers, totalProducts, lowStockCount, pendingReviews,
      },
      recentOrders: recentOrders.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() })),
      dailySales,
    };
  },
  [TAGS.dashboard],
  { revalidate: 60, tags: [TAGS.dashboard] }
);

export default async function AdminDashboard() {
  const data = await getDashboardData();
  return <AdminDashboardClient data={data} />;
}
