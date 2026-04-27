import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { successResponse, unauthorizedResponse, serverErrorResponse } from "@/lib/response";
import { revalidateTag } from "next/cache";
import { TAGS } from "@/lib/cache";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin().catch(() => null);
    if (!session) return unauthorizedResponse();
    const { id } = await params;
    const body = await request.json();
    const { variants, images, categoryId, ingredientsImage, ...rest } = body;
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...rest,
        category: { connect: { id: categoryId } },
        ...(variants && {
          variants: {
            deleteMany: {},
            create: variants.map((v: { name: string; price: number; comparePrice?: number | null; stock: number; sku?: string | null }) => ({
              name: v.name, price: Number(v.price),
              comparePrice: v.comparePrice ? Number(v.comparePrice) : null,
              stock: Number(v.stock), sku: v.sku || null, isActive: true,
            })),
          },
        }),
        ...(images && {
          images: {
            deleteMany: {},
            create: images.map((img: { url: string; altText?: string | null; isPrimary?: boolean }, i: number) => ({
              url: img.url, altText: img.altText || null, isPrimary: i === 0, sortOrder: i,
            })),
          },
        }),
      },
    });
    revalidateTag(TAGS.products);
    return successResponse({ product }, "Product updated");
  } catch (error) {
    console.error("product PATCH error:", error);
    return serverErrorResponse();
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin().catch(() => null);
    if (!session) return unauthorizedResponse();
    const { id } = await params;
    await prisma.productImage.deleteMany({ where: { productId: id } });
    await prisma.cartItem.deleteMany({ where: { productId: id } });
    await prisma.wishlist.deleteMany({ where: { productId: id } });
    await prisma.review.deleteMany({ where: { productId: id } });
    await prisma.orderItem.deleteMany({ where: { productId: id } });
    await prisma.productVariant.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });
    revalidateTag(TAGS.products);
    return successResponse({}, "Product deleted");
  } catch { return serverErrorResponse(); }
}
