import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, notFoundResponse, serverErrorResponse } from "@/lib/response";
import { unstable_cache } from "next/cache";
import { TAGS } from "@/lib/cache";

function getProductBySlug(slug: string) {
  return unstable_cache(
    async () => {
      const [product, ratingAgg] = await Promise.all([
        prisma.product.findUnique({
          where: { slug, isActive: true },
          include: {
            category: { select: { id: true, name: true, slug: true } },
            images: { orderBy: { sortOrder: "asc" } },
            variants: { where: { isActive: true }, orderBy: { price: "asc" } },
            reviews: {
              where: { status: "APPROVED" },
              include: { user: { select: { name: true, avatar: true } } },
              orderBy: { createdAt: "desc" },
              take: 10,
            },
            _count: { select: { reviews: { where: { status: "APPROVED" } } } },
          },
        }),
        prisma.review.aggregate({
          where: { product: { slug }, status: "APPROVED" },
          _avg: { rating: true },
        }),
      ]);

      if (!product) return null;

      const related = await prisma.product.findMany({
        where: { categoryId: product.categoryId, id: { not: product.id }, isActive: true },
        include: {
          images: { where: { isPrimary: true }, take: 1 },
          variants: { where: { isActive: true }, orderBy: { price: "asc" }, take: 1 },
        },
        take: 6,
      });

      return {
        product: { ...product, avgRating: ratingAgg._avg.rating || 0, reviewCount: product._count.reviews },
        related: related.map((r) => ({
          id: r.id, name: r.name, slug: r.slug,
          image: r.images[0]?.url || null,
          price: r.variants[0]?.price || 0,
          comparePrice: r.variants[0]?.comparePrice || null,
        })),
      };
    },
    [TAGS.product(slug)],
    { revalidate: 86400, tags: [TAGS.product(slug), TAGS.products] }
  )();
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const data = await getProductBySlug(slug);
    if (!data) return notFoundResponse("Product not found");
    return successResponse(data);
  } catch (error) {
    console.error("product GET error:", error);
    return serverErrorResponse();
  }
}
