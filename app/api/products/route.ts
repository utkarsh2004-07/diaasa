import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, serverErrorResponse } from "@/lib/response";
import { unstable_cache } from "next/cache";
import { TAGS } from "@/lib/cache";

const getProducts = unstable_cache(
  async (params: {
    page: number; limit: number; category?: string; search?: string;
    minPrice?: string; maxPrice?: string; sort: string;
    featured?: string; newArrivals?: string; bestSeller?: string;
  }) => {
    const { page, limit, category, search, minPrice, maxPrice, sort, featured, newArrivals, bestSeller } = params;

    const where: Record<string, unknown> = { isActive: true };

    if (category) {
      const cat = await prisma.category.findUnique({ where: { slug: category }, select: { id: true } });
      if (cat) where.categoryId = cat.id;
    }
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { shortDesc: { contains: search } },
        { brand: { contains: search } },
        { tags: { contains: search } },
      ];
    }
    if (featured === "true") where.isFeatured = true;
    if (newArrivals === "true") where.isNew = true;
    if (bestSeller === "true") where.isBestSeller = true;
    if (minPrice) where.variants = { some: { price: { gte: Number(minPrice) }, isActive: true } };
    if (maxPrice) {
      where.variants = {
        some: {
          ...(where.variants as Record<string, unknown>)?.some as object,
          price: { gte: Number(minPrice) || 0, lte: Number(maxPrice) },
          isActive: true,
        },
      };
    }

    const [sortField, sortDir] = sort.split("_");
    const orderBy: Record<string, string> = {};
    if (sortField !== "price") {
      orderBy[sortField || "createdAt"] = sortDir || "desc";
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { name: true, slug: true } },
          images: { where: { isPrimary: true }, take: 2 },
          variants: { where: { isActive: true }, orderBy: { price: "asc" }, take: 1 },
          _count: { select: { reviews: { where: { status: "APPROVED" } } } },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    const formatted = products.map((p) => ({
      id: p.id, name: p.name, slug: p.slug, shortDesc: p.shortDesc,
      category: p.category, brand: p.brand,
      isFeatured: p.isFeatured, isNew: p.isNew, isBestSeller: p.isBestSeller,
      image: p.images[0]?.url || null,
      hoverImage: p.images[1]?.url || null,
      price: p.variants[0]?.price || 0,
      comparePrice: p.variants[0]?.comparePrice || null,
      reviewCount: p._count.reviews,
      inStock: (p.variants[0]?.stock || 0) > 0,
      variantId: p.variants[0]?.id,
    }));

    return {
      products: formatted,
      pagination: {
        page, limit, total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  },
  [TAGS.products],
  { revalidate: 86400, tags: [TAGS.products] }
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const data = await getProducts({
      page: Number(searchParams.get("page") || 1),
      limit: Math.min(Number(searchParams.get("limit") || 20), 100),
      category: searchParams.get("category") || undefined,
      search: searchParams.get("q") || undefined,
      minPrice: searchParams.get("minPrice") || undefined,
      maxPrice: searchParams.get("maxPrice") || undefined,
      sort: searchParams.get("sort") || "createdAt_desc",
      featured: searchParams.get("featured") || undefined,
      newArrivals: searchParams.get("new") || undefined,
      bestSeller: searchParams.get("bestseller") || undefined,
    });
    return successResponse(data);
  } catch (error) {
    console.error("products GET error:", error);
    return serverErrorResponse();
  }
}
