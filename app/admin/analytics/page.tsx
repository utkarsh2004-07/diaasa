export const dynamic = "force-dynamic";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import AdminAnalyticsClient from "@/components/admin/AdminAnalyticsClient";

const getAnalyticsData = unstable_cache(
  async () => {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const [
      rawMonthly,
      topProducts,
      statusBreakdown,
      lowStock,
      rawUserGrowth,
    ] = await Promise.all([
      // Single query for 6-month revenue — replaces 6 separate aggregate calls
      prisma.$queryRaw<Array<{ month: string; revenue: number; orders: number }>>`
        SELECT
          DATE_FORMAT(createdAt, '%b %y') as month,
          COALESCE(SUM(total), 0) as revenue,
          COUNT(*) as orders
        FROM orders
        WHERE createdAt >= ${sixMonthsAgo}
          AND paymentStatus = 'PAID'
        GROUP BY DATE_FORMAT(createdAt, '%b %y'), YEAR(createdAt), MONTH(createdAt)
        ORDER BY YEAR(createdAt) ASC, MONTH(createdAt) ASC
      `,
      prisma.orderItem.groupBy({
        by: ["productId", "name"],
        _sum: { total: true, quantity: true },
        _count: true,
        orderBy: { _count: { productId: "desc" } },
        take: 5,
      }),
      prisma.order.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.productVariant.findMany({
        where: { stock: { lte: 10 }, isActive: true },
        select: { id: true, name: true, stock: true, product: { select: { name: true } } },
        orderBy: { stock: "asc" },
        take: 10,
      }),
      // Single query for 6-month user growth — replaces 6 separate count calls
      prisma.$queryRaw<Array<{ month: string; users: number }>>`
        SELECT
          DATE_FORMAT(createdAt, '%b %y') as month,
          COUNT(*) as users
        FROM users
        WHERE createdAt >= ${sixMonthsAgo}
        GROUP BY DATE_FORMAT(createdAt, '%b %y'), YEAR(createdAt), MONTH(createdAt)
        ORDER BY YEAR(createdAt) ASC, MONTH(createdAt) ASC
      `,
    ]);

    // Build full 6-month arrays filling gaps with 0
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      return d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
    });

    const monthly = months.map((month) => {
      const found = rawMonthly.find((r) => r.month === month);
      return { month, revenue: found ? Number(found.revenue) : 0, orders: found ? Number(found.orders) : 0 };
    });

    const userGrowth = months.map((month) => {
      const found = rawUserGrowth.find((r) => r.month === month);
      return { month, users: found ? Number(found.users) : 0 };
    });

    return { monthly, topProducts, statusBreakdown, lowStock, userGrowth };
  },
  ["admin-analytics"],
  { revalidate: 120 }
);

export default async function AdminAnalyticsPage() {
  const data = await getAnalyticsData();
  return <AdminAnalyticsClient data={data} />;
}
