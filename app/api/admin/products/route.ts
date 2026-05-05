import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { successResponse, unauthorizedResponse, serverErrorResponse, errorResponse } from "@/lib/response";
import { revalidateTag } from "next/cache";
import { TAGS } from "@/lib/cache";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin().catch(() => null);
    if (!session) return unauthorizedResponse();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const page = Number(searchParams.get("page") || 1);
    const where = q ? { OR: [{ name: { contains: q } }, { sku: { contains: q } }] } : {};
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true, images: { take: 1 }, variants: { take: 1 } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * 20,
        take: 20,
      }),
      prisma.product.count({ where }),
    ]);
    return successResponse({ products, total, page, pages: Math.ceil(total / 20) });
  } catch { return serverErrorResponse(); }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin().catch(() => null);
    if (!session) return unauthorizedResponse();
    const body = await request.json();
    const { name, slug, description, shortDesc, categoryId, brand, gstPercent,
            isActive, isFeatured, isNew, isBestSeller, tags, sku,
            whyWeLove, whyWeLoveItems, howToUse, benefits, keyIngredients,
            benefitsImage, ingredientsImages,
            variants = [], images = [] } = body;
    if (!name || !slug || !categoryId) return errorResponse("VALIDATION_ERROR", "name, slug and categoryId are required");
    const product = await prisma.$transaction(async (tx) => {
      return tx.product.create({
        data: {
          name, slug, description, shortDesc, categoryId, brand,
          gstPercent: gstPercent || 18, isActive: isActive ?? true,
          isFeatured: isFeatured ?? false, isNew: isNew ?? false,
          isBestSeller: isBestSeller ?? false, tags, sku,
          whyWeLove: whyWeLove || null, whyWeLoveItems: whyWeLoveItems || null,
          howToUse: howToUse || null,
          benefits: benefits || null, keyIngredients: keyIngredients || null,
          benefitsImage: benefitsImage || null,
          ingredientsImages: ingredientsImages || null,
          variants: {
            create: variants.map((v: { name: string; price: number; comparePrice?: number; stock?: number; sku?: string }) => ({
              name: v.name, price: v.price,
              comparePrice: v.comparePrice || null,
              stock: v.stock || 0, sku: v.sku || null, isActive: true,
            })),
          },
          images: {
            create: images.map((img: { url: string; altText?: string; isPrimary?: boolean }, i: number) => ({
              url: img.url, altText: img.altText || null, isPrimary: i === 0, sortOrder: i,
            })),
          },
        },
      });
    });
    revalidateTag(TAGS.products, "max");
    return successResponse({ product }, "Product created", 201);
  } catch (error) {
    console.error("admin product POST error:", error);
    return serverErrorResponse();
  }
}
