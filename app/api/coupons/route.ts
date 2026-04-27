import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { rateLimitCoupon } from "@/lib/ratelimit";
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from "@/lib/response";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return unauthorizedResponse();

    const rl = await rateLimitCoupon(session.userId);
    if (!rl.allowed) return errorResponse("RATE_LIMIT_EXCEEDED", "Too many coupon attempts", 429);

    const { code, cartTotal } = await request.json();
    if (!code) return errorResponse("VALIDATION_ERROR", "Coupon code required");

    const coupon = await prisma.coupon.findFirst({
      where: {
        code: code.toUpperCase().trim(),
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    if (!coupon) return errorResponse("INVALID_COUPON", "Invalid or expired coupon code");
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
      return errorResponse("COUPON_EXHAUSTED", "This coupon has reached its usage limit");
    if (cartTotal < coupon.minCartValue)
      return errorResponse("COUPON_MIN_VALUE", `Minimum cart value of ₹${coupon.minCartValue} required`);

    const discount =
      coupon.type === "PERCENTAGE"
        ? Math.min((cartTotal * coupon.value) / 100, coupon.maxDiscount || Infinity)
        : Math.min(coupon.value, cartTotal);

    return successResponse({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discount: Math.round(discount * 100) / 100,
      description: coupon.description,
    }, `Coupon applied! You save ₹${discount.toFixed(2)}`);
  } catch {
    return serverErrorResponse();
  }
}
