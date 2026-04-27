import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { TAGS } from "@/lib/cache";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";

const getDashboardData = unstable_cache(
  async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    const [
      totalOrders, monthOrders, lastMonthOrders,
      totalRevenue, monthRevenue,
      totalUsers, newUsers,
      totalProducts, lowStockCount,
      pendingReviews,
      recentOrders,
      paidOrders,
    ] = await Promise.all([
      prisma.order.count({ where: { status: { notIn: ["CANCELLED", "PENDING"] } } }),
      prisma.order.count({ where: { createdAt: { gte: startOfMonth }, status: { notIn: ["CANCELLED", "PENDING"] } } }),
      prisma.order.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }, status: { notIn: ["CANCELLED", "PENDING"] } } }),
      prisma.order.aggregate({ where: { paymentStatus: "PAID" }, _sum: { total: true } }),
      prisma.order.aggregate({ where: { paymentStatus: "PAID", createdAt: { gte: startOfMonth } }, _sum: { total: true } }),
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.productVariant.count({ where: { stock: { lte: 5 }, isActive: true } }),
      prisma.review.count({ where: { status: "PENDING" } }),
      // Fixed: was where: {} — now scoped to recent orders only
      prisma.order.findMany({
        where: { createdAt: { gte: startOfMonth } },
        select: {
          id: true, orderNumber: true, status: true,
          total: true, createdAt: true,
          user: { select: { name: true, phone: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.order.findMany({
        where: {
          paymentStatus: "PAID",
          status: { notIn: ["CANCELLED", "PENDING"] },
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0) - 6 * 24 * 60 * 60 * 1000),
          },
        },
        select: { total: true, createdAt: true },
      }),
    ]);

    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const dailySales = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dayStr = d.toISOString().slice(0, 10);
      const dayOrders = paidOrders.filter((o) => o.createdAt.toISOString().slice(0, 10) === dayStr);
      return {
        date: `${d.getDate()} ${MONTHS[d.getMonth()]}`,
        revenue: dayOrders.reduce((sum, o) => sum + o.total, 0),
        orders: dayOrders.length,
      };
    });

    return {
      stats: {
        totalOrders, monthOrders,
        orderGrowth: lastMonthOrders
          ? Math.round(((monthOrders - lastMonthOrders) / lastMonthOrders) * 100)
          : 100,
        totalRevenue: totalRevenue._sum.total || 0,
        monthRevenue: monthRevenue._sum.total || 0,
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
