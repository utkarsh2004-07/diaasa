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

    // TODO: Re-enable after 2 days — only allow review if user has a DELIVERED order
    // const deliveredOrder = await prisma.orderItem.findFirst({
    //   where: {
    //     productId,
    //     order: {
    //       userId: session.userId,
    //       status: "DELIVERED",
    //     },
    //   },
    //   include: { order: true },
    // });

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
      canReview: !existingReview,          // TODO: restore to: !!deliveredOrder && !existingReview
      hasDeliveredOrder: true,             // TODO: restore to: !!deliveredOrder
      hasExistingReview: !!existingReview,
    });
  } catch (error) {
    console.error("Review eligibility check error:", error);
    return serverErrorResponse();
  }
}