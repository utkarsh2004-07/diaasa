import { prisma } from "@/lib/prisma";
import AdminInventoryClient from "@/components/admin/AdminInventoryClient";

export default async function AdminInventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const { q, filter } = await searchParams;

  const where: Record<string, unknown> = { isActive: true };
  if (filter === "low") where.stock = { lte: 10 };
  if (filter === "out") where.stock = 0;

  const variants = await prisma.productVariant.findMany({
    where,
    include: {
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          images: { where: { isPrimary: true }, take: 1 },
        },
      },
    },
    orderBy: { stock: "asc" },
    take: 100,
  });

  const filtered = q
    ? variants.filter((v) =>
        v.product.name.toLowerCase().includes(q.toLowerCase()) ||
        v.name.toLowerCase().includes(q.toLowerCase())
      )
    : variants;

  const stats = {
    total: variants.length,
    outOfStock: variants.filter((v) => v.stock === 0).length,
    lowStock: variants.filter((v) => v.stock > 0 && v.stock <= 10).length,
    healthy: variants.filter((v) => v.stock > 10).length,
  };

  return <AdminInventoryClient variants={filtered} stats={stats} />;
}
