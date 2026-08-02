export const dynamic = "force-dynamic";

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { TAGS } from "@/lib/cache";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import { BenefitsBar, CategoryStrip, FeaturedProducts, PromoBannerSection } from "@/components/home/HomeComponents";
import { BestSellers, NewArrivals, PromoSection, Testimonials, InstagramGrid } from "@/components/home/SectionComponents";
import { LabTestedSection } from "@/components/home/LabTestedSection";
import { FounderSection } from "@/components/home/FounderSection";

const getHomeData = unstable_cache(
  async () => {
    const [banners, promoBanners, categories, featured, bestSellers, newArrivals, reviews, socialPosts] = await Promise.all([
      prisma.banner.findMany({ where: { type: "HERO", isActive: true }, orderBy: { priority: "asc" }, take: 5 }),
      prisma.banner.findMany({ where: { type: "PROMO", isActive: true }, orderBy: { priority: "asc" }, take: 3 }),
      prisma.category.findMany({ 
        where: { isActive: true, parentId: null }, 
        orderBy: { sortOrder: "asc" }, 
        take: 6,
        include: { _count: { select: { products: { where: { isActive: true } } } } }
      }),
      prisma.product.findMany({
        where: { isActive: true, isFeatured: true },
        include: { images: { orderBy: { sortOrder: "asc" }, take: 2 }, variants: { where: { isActive: true }, orderBy: { price: "asc" }, take: 1 }, _count: { select: { reviews: { where: { status: "APPROVED" } } } } },
        take: 8,
      }),
      prisma.product.findMany({
        where: { isActive: true, isBestSeller: true },
        include: { images: { orderBy: { sortOrder: "asc" }, take: 2 }, variants: { where: { isActive: true }, orderBy: { price: "asc" }, take: 1 }, _count: { select: { reviews: { where: { status: "APPROVED" } } } } },
        take: 8,
      }),
      prisma.product.findMany({
        where: { isActive: true, isNew: true },
        include: { images: { orderBy: { sortOrder: "asc" }, take: 2 }, variants: { where: { isActive: true }, orderBy: { price: "asc" }, take: 1 }, _count: { select: { reviews: { where: { status: "APPROVED" } } } } },
        orderBy: { createdAt: "desc" }, take: 4,
      }),
      prisma.review.findMany({
        where: { status: "APPROVED", rating: { gte: 4 } },
        include: { user: { select: { name: true, avatar: true } }, product: { select: { name: true } } },
        orderBy: { createdAt: "desc" }, take: 6,
      }),
      prisma.socialPost.findMany({ where: { isActive: true }, orderBy: { sortOrder: "asc" } }),
    ]);
    return { banners, promoBanners, categories, featured, bestSellers, newArrivals, reviews, socialPosts };
  },
  ["homepage"],
  {
    revalidate: 86400, // 24 hours fallback
    tags: [TAGS.banners, TAGS.products, TAGS.categories, TAGS.socialPosts],
  }
);

export default async function HomePage() {
  const data = await getHomeData();

  const mapProduct = (p: typeof data.featured[0]) => ({
    id: p.id, name: p.name, slug: p.slug,
    image: p.images[0]?.url || null,
    hoverImage: p.images[1]?.url || null,
    price: p.variants[0]?.price || 0,
    comparePrice: p.variants[0]?.comparePrice || null,
    reviewCount: p._count.reviews,
    inStock: (p.variants[0]?.stock || 0) > 0,
    isBestSeller: (p as { isBestSeller?: boolean }).isBestSeller,
    isNew: (p as { isNew?: boolean }).isNew,
    variantId: p.variants[0]?.id,
  });

  return (
    <>
      <Header />
      <main>
        <HeroSection banners={data.banners} />
        <BenefitsBar />
        <CategoryStrip categories={data.categories.map(c => ({ ...c, productCount: c._count.products }))} />
        <FeaturedProducts products={data.featured.map(mapProduct)} />
        <PromoBannerSection banners={data.promoBanners} />
        <PromoSection />
        <BestSellers products={data.bestSellers.map(mapProduct)} />
        <NewArrivals products={data.newArrivals.map(mapProduct)} />
        <Testimonials reviews={data.reviews} />
        <FounderSection />
        <LabTestedSection />
        <InstagramGrid posts={data.socialPosts} />
      </main>
      <Footer />
    </>
  );
}
