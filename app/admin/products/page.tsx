export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";
import AdminProductsClient from "@/components/admin/AdminProductsClient";

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { page = "1", q } = await searchParams;
  const pg = Math.max(1, Number(page));
  const limit = 20;

  const where = q
    ? { OR: [{ name: { contains: q } }, { sku: { contains: q } }] }
    : {};

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        images: { where: { isPrimary: true }, take: 1 },
        variants: { where: { isActive: true }, orderBy: { price: "asc" }, take: 1 },
        _count: { select: { reviews: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (pg - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="font-body text-2xl font-semibold text-charcoal-900">Products</h1>
        <Link href="/admin/products/new" className="btn-primary flex items-center gap-2 text-sm py-2.5">
          <Plus size={16} /> Add Product
        </Link>
      </div>

      <div className="bg-white rounded-xl p-4 shadow-soft border border-charcoal-50">
        <form className="flex gap-3">
          <input name="q" defaultValue={q} placeholder="Search products…" className="input-base max-w-sm py-2 text-sm" />
          <button type="submit" className="btn-primary py-2 px-4 text-sm">Search</button>
        </form>
      </div>

      <AdminProductsClient
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          categoryName: p.category.name,
          imageUrl: p.images[0]?.url || null,
          price: p.variants[0]?.price || null,
          stock: p.variants[0]?.stock ?? 0,
          isActive: p.isActive,
        }))}
        total={total}
        page={pg}
        limit={limit}
        q={q}
      />
    </div>
  );
}
