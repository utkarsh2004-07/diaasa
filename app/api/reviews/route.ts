import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { rateLimitReview } from "@/lib/ratelimit";
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from "@/lib/response";
import { z } from "zod";

const schema = z.object({
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  message: z.string().min(10).max(1000),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    if (!productId) return errorResponse("VALIDATION_ERROR", "productId required");

    const reviews = await prisma.review.findMany({
      where: { productId, status: "APPROVED" },
      include: { user: { select: { name: true, avatar: true } } },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    const agg = await prisma.review.aggregate({
      where: { productId, status: "APPROVED" },
      _avg: { rating: true },
      _count: true,
    });

    const distribution = await prisma.review.groupBy({
      by: ["rating"],
      where: { productId, status: "APPROVED" },
      _count: true,
    });

    return successResponse({
      reviews,
      avgRating: agg._avg.rating || 0,
      totalCount: agg._count,
      distribution: distribution.reduce(
        (acc, d) => ({ ...acc, [d.rating]: d._count }),
        {} as Record<number, number>
      ),
    });
  } catch (error) {
    return serverErrorResponse();
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return unauthorizedResponse();

    const rl = await rateLimitReview(session.userId);
    if (!rl.allowed) return errorResponse("RATE_LIMIT_EXCEEDED", "Too many reviews submitted", 429);

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success)
      return errorResponse("VALIDATION_ERROR", parsed.error.errors[0].message);

    const { productId, rating, title, message } = parsed.data;

    // Check if user has delivered order with this product
    const deliveredOrder = await prisma.orderItem.findFirst({
      where: {
        productId,
        order: {
          userId: session.userId,
          status: "DELIVERED",
        },
      },
    });
    if (!deliveredOrder) return errorResponse("NOT_ELIGIBLE", "You can only review products from delivered orders");

    const existing = await prisma.review.findUnique({
      where: { userId_productId: { userId: session.userId, productId } },
    });
    if (existing) return errorResponse("ALREADY_REVIEWED", "You have already reviewed this product");

    const review = await prisma.review.create({
      data: { userId: session.userId, productId, rating, title, message, status: "PENDING" },
    });

    return successResponse({ review }, "Review submitted! It will be visible after moderation.", 201);
  } catch (error) {
    return serverErrorResponse();
  }
}
