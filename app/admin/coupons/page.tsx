export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import AdminCouponsClient from "@/components/admin/AdminCouponsClient";

export default async function AdminCouponsPage() {
  const [coupons, products] = await Promise.all([
    prisma.coupon.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.product.findMany({
      where: { isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);
  return <AdminCouponsClient coupons={coupons} products={products} />;
}
