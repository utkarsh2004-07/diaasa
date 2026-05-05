import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductDetail from "@/components/product/ProductDetail";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    select: { name: true, shortDesc: true, metaTitle: true, metaDesc: true },
  });
  if (!product) return { title: "Product Not Found" };
  return {
    title: product.metaTitle || product.name,
    description: product.metaDesc || product.shortDesc || "",
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    include: {
      category: { select: { id: true, name: true, slug: true } },
      images: { orderBy: { sortOrder: "asc" } },
      variants: { where: { isActive: true }, orderBy: { price: "asc" } },
      reviews: {
        where: { status: "APPROVED" },
        include: { user: { select: { name: true, avatar: true } } },
        orderBy: { createdAt: "desc" },
        take: 8,
      },
      _count: { select: { reviews: { where: { status: "APPROVED" } } } },
    },
  });

  if (!product) notFound();

  const avgRating = product.reviews.length
    ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
    : 0;

  const related = await prisma.product.findMany({
    where: { categoryId: product.categoryId, id: { not: product.id }, isActive: true },
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      variants: { where: { isActive: true }, orderBy: { price: "asc" }, take: 1 },
    },
    take: 4,
  });

  // fetch active coupons to show on product page
  const coupons = await prisma.coupon.findMany({
    where: { isActive: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    select: { code: true, type: true, value: true, minCartValue: true, description: true },
    take: 5,
  });

  return (
    <>
      <Header />
      <main className="min-h-screen bg-cream-50">
        <ProductDetail
          product={{ ...product, avgRating, reviewCount: product._count.reviews }}
          coupons={coupons}
          related={related.map((r) => ({
            id: r.id, name: r.name, slug: r.slug,
            image: r.images[0]?.url || null,
            price: r.variants[0]?.price || 0,
            comparePrice: r.variants[0]?.comparePrice || null,
            variantId: r.variants[0]?.id,
            inStock: (r.variants[0]?.stock || 0) > 0,
          }))}
        />
      </main>
      <Footer />
    </>
  );
}
