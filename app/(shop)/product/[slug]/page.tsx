import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductDetail from "@/components/product/ProductDetail";

export const dynamic = "force-dynamic";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://www.diaasa.com";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.product.findUnique({
    where: { slug, isActive: true },
    select: {
      name: true, shortDesc: true, metaTitle: true, metaDesc: true,
      brand: true, tags: true,
      images: { where: { isPrimary: true }, take: 1 },
      variants: { where: { isActive: true }, orderBy: { price: "asc" }, take: 1 },
    },
  });
  if (!product) return { title: "Product Not Found" };

  const title = product.metaTitle || `${product.name} | Diaasa Store`;
  const description = product.metaDesc || product.shortDesc || `Buy ${product.name} from Diaasa Store`;
  const image = product.images[0]?.url || `${APP_URL}/images/placeholder-product.jpg`;
  const url = `${APP_URL}/product/${slug}`;
  const price = product.variants[0]?.price;

  return {
    title,
    description,
    keywords: product.tags || `${product.name}, ${product.brand || ""}, diaasa, skincare, beauty`,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: "Diaasa Store",
      images: [{ url: image, width: 800, height: 800, alt: product.name }],
      type: "website",
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    other: {
      "product:price:amount": price ? String(price) : "",
      "product:price:currency": "INR",
    },
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
    where: { isActive: true, isPublic: true, OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
    select: { code: true, type: true, value: true, minCartValue: true, description: true },
    take: 5,
  });

  return (
    <>
      <Header />
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.shortDesc || "",
            image: product.images.map((i) => i.url),
            brand: { "@type": "Brand", name: product.brand || "Diaasa" },
            offers: product.variants.map((v) => ({
              "@type": "Offer",
              price: v.price,
              priceCurrency: "INR",
              availability: v.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
              url: `${APP_URL}/product/${product.slug}`,
            })),
            aggregateRating: avgRating > 0 ? {
              "@type": "AggregateRating",
              ratingValue: avgRating.toFixed(1),
              reviewCount: product._count.reviews,
            } : undefined,
          }),
        }}
      />
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
