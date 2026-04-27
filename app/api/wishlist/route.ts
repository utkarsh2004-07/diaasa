import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from "@/lib/response";

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session) return unauthorizedResponse();

    const items = await prisma.wishlist.findMany({
      where: { userId: session.userId },
      include: {
        product: {
          include: {
            images: { where: { isPrimary: true }, take: 1 },
            variants: { where: { isActive: true }, orderBy: { price: "asc" }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse({ items });
  } catch {
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return unauthorizedResponse();

    const { productId } = await request.json();
    if (!productId) return errorResponse("VALIDATION_ERROR", "productId required");

    await prisma.wishlist.upsert({
      where: { userId_productId: { userId: session.userId, productId } },
      update: {},
      create: { userId: session.userId, productId },
    });

    return successResponse({}, "Added to wishlist");
  } catch {
    return serverErrorResponse();
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    if (!productId) return errorResponse("VALIDATION_ERROR", "productId required");

    await prisma.wishlist.deleteMany({
      where: { userId: session.userId, productId },
    });

    return successResponse({}, "Removed from wishlist");
  } catch {
    return serverErrorResponse();
  }
}
