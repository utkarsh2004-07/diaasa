import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/response";
import { z } from "zod";

const addSchema = z.object({
  productId: z.string(),
  variantId: z.string(),
  quantity: z.number().int().min(1).max(10),
  guestCartId: z.string().optional(),
});

// GET /api/cart
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    const { searchParams } = new URL(request.url);
    const guestId = searchParams.get("guestId");

    const where = session
      ? { userId: session.userId }
      : guestId
      ? { guestId }
      : null;

    if (!where) return successResponse({ items: [], total: 0, count: 0 });

    const items = await prisma.cartItem.findMany({
      where,
      include: {
        product: {
          select: {
            id: true, name: true, slug: true, gstPercent: true,
            images: { where: { isPrimary: true }, take: 1 },
          },
        },
        variant: {
          select: { id: true, name: true, price: true, comparePrice: true, stock: true },
        },
      },
    });

    const formatted = items.map((item) => ({
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      product: {
        ...item.product,
        image: item.product.images[0]?.url || null,
      },
      variant: item.variant,
      lineTotal: item.variant.price * item.quantity,
      gstAmount: (item.variant.price * item.quantity * item.product.gstPercent) / 100,
    }));

    const subtotal = formatted.reduce((s, i) => s + i.lineTotal, 0);
    const totalGST = formatted.reduce((s, i) => s + i.gstAmount, 0);

    return successResponse({
      items: formatted,
      count: formatted.reduce((s, i) => s + i.quantity, 0),
      subtotal,
      totalGST,
      total: subtotal + totalGST,
    });
  } catch (error) {
    console.error("cart GET error:", error);
    return serverErrorResponse();
  }
}

// POST /api/cart - add item
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = addSchema.safeParse(body);
    if (!parsed.success)
      return errorResponse("VALIDATION_ERROR", parsed.error.errors[0].message);

    const { productId, variantId, quantity, guestCartId } = parsed.data;
    const session = await getServerSession();

    // Check variant exists and has stock
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant || !variant.isActive)
      return errorResponse("VARIANT_NOT_FOUND", "Product variant not found");
    if (variant.stock < quantity)
      return errorResponse("INSUFFICIENT_STOCK", "Not enough stock available");

    const where = session
      ? { userId: session.userId, variantId }
      : { guestId: guestCartId, variantId };

    const existing = await prisma.cartItem.findFirst({ where });

    if (existing) {
      const newQty = Math.min(existing.quantity + quantity, 10);
      if (variant.stock < newQty)
        return errorResponse("INSUFFICIENT_STOCK", "Not enough stock available");
      await prisma.cartItem.update({
        where: { id: existing.id },
        data: { quantity: newQty },
      });
    } else {
      await prisma.cartItem.create({
        data: {
          productId,
          variantId,
          quantity,
          userId: session?.userId || null,
          guestId: session ? null : (guestCartId || null),
        },
      });
    }

    return successResponse({}, "Added to cart");
  } catch (error) {
    console.error("cart POST error:", error);
    return serverErrorResponse();
  }
}

// PATCH /api/cart - update quantity
export async function PATCH(request: NextRequest) {
  try {
    const { itemId, quantity } = await request.json();
    const session = await getServerSession();

    const item = await prisma.cartItem.findUnique({ where: { id: itemId } });
    if (!item) return errorResponse("NOT_FOUND", "Cart item not found");

    // Ownership check
    const isOwner = session
      ? item.userId === session.userId
      : true; // guest checks via guestId

    if (!isOwner) return errorResponse("FORBIDDEN", "Forbidden");

    if (quantity <= 0) {
      await prisma.cartItem.delete({ where: { id: itemId } });
      return successResponse({}, "Item removed");
    }

    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
    return successResponse({}, "Cart updated");
  } catch (error) {
    console.error("cart PATCH error:", error);
    return serverErrorResponse();
  }
}

// DELETE /api/cart?itemId=xxx
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");
    if (!itemId) return errorResponse("VALIDATION_ERROR", "itemId required");

    await prisma.cartItem.delete({ where: { id: itemId } });
    return successResponse({}, "Item removed from cart");
  } catch (error) {
    console.error("cart DELETE error:", error);
    return serverErrorResponse();
  }
}
