import { NextRequest } from "next/server";
import { getServerSession } from "@/lib/auth";
import { rateLimitCoupon } from "@/lib/ratelimit";
import { validateCoupon } from "@/lib/coupon-engine";
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from "@/lib/response";
import { z } from "zod";

const schema = z.object({
  code: z.string().min(1),
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string(),
    quantity: z.number().int().min(1).max(10),
  })).min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return unauthorizedResponse();

    const rl = rateLimitCoupon(session.userId);
    if (!rl.allowed) return errorResponse("RATE_LIMIT_EXCEEDED", "Too many coupon attempts", 429);

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success)
      return errorResponse("VALIDATION_ERROR", parsed.error.errors[0].message);

    const result = await validateCoupon(parsed.data.code, parsed.data.items, session.userId);

    if (!result.valid)
      return errorResponse(result.errorCode || "INVALID_COUPON", result.error || "Invalid coupon");

    return successResponse({
      code: result.code,
      discount: result.discount,
      subtotal: result.subtotal,
      shipping: result.shipping,
      total: result.total,
    }, `Coupon applied! You save ₹${result.discount}`);
  } catch {
    return serverErrorResponse();
  }
}
