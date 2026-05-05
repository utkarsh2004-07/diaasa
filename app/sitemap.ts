export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

export default async function sitemap() {
  let products: { slug: string; updatedAt: Date }[] = [];
  let categories: { slug: string; updatedAt: Date }[] = [];

  try {
    const { prisma } = await import("@/lib/prisma");
    [products, categories] = await Promise.all([
      prisma.product.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
      prisma.category.findMany({ where: { isActive: true }, select: { slug: true, updatedAt: true } }),
    ]);
  } catch {}

  const staticPages = [
    { url: APP_URL, lastModified: new Date(), priority: 1.0 },
    { url: `${APP_URL}/products`, lastModified: new Date(), priority: 0.9 },
    { url: `${APP_URL}/pages/about`, lastModified: new Date(), priority: 0.5 },
    { url: `${APP_URL}/pages/terms`, lastModified: new Date(), priority: 0.3 },
    { url: `${APP_URL}/pages/privacy`, lastModified: new Date(), priority: 0.3 },
    { url: `${APP_URL}/pages/shipping`, lastModified: new Date(), priority: 0.4 },
    { url: `${APP_URL}/pages/refund`, lastModified: new Date(), priority: 0.4 },
  ];

  const productPages = products.map((p) => ({
    url: `${APP_URL}/product/${p.slug}`,
    lastModified: p.updatedAt,
    priority: 0.8,
  }));

  const categoryPages = categories.map((c) => ({
    url: `${APP_URL}/products?category=${c.slug}`,
    lastModified: c.updatedAt,
    priority: 0.7,
  }));

  return [...staticPages, ...productPages, ...categoryPages];
}
