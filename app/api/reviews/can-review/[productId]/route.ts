import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return errorResponse("UNAUTHORIZED", "Login required", 401);
    }

    const { productId } = await params;

    // Check if user has delivered order with this product
    const deliveredOrder = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId: session.userId,
          status: "DELIVERED",
        },
      },
      include: {
        order: true,
      },
    });

    // Check if user already reviewed this product
    const existingReview = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId: session.userId,
          productId,
        },
      },
    });

    return successResponse({
      canReview: !!deliveredOrder && !existingReview,
      hasDeliveredOrder: !!deliveredOrder,
      hasExistingReview: !!existingReview,
    });
  } catch (error) {
    console.error("Review eligibility check error:", error);
    return serverErrorResponse();
  }
}