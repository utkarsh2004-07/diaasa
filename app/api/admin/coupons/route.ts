import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { successResponse, unauthorizedResponse, serverErrorResponse, errorResponse } from "@/lib/response";

export async function GET() {
  try {
    const session = await requireAdmin().catch(() => null);
    if (!session) return unauthorizedResponse();
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    return successResponse({ coupons });
  } catch { return serverErrorResponse(); }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin().catch(() => null);
    if (!session) return unauthorizedResponse();
    const body = await request.json();
    const { code, type, value, minCartValue, maxDiscount, usageLimit, description, expiresAt, isActive, isPublic, requiredProducts, allowExtraProducts } = body;

    if (!code || !value) return errorResponse("VALIDATION_ERROR", "Code and value are required");

    const existing = await prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
    if (existing) return errorResponse("DUPLICATE_CODE", "Coupon code already exists");

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        type: type || "PERCENTAGE",
        value: Number(value),
        minCartValue: Number(minCartValue) || 0,
        maxDiscount: maxDiscount ? Number(maxDiscount) : null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        description: description || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        isActive: isActive ?? true,
        isPublic: isPublic ?? true,
        requiredProducts: requiredProducts?.length ? requiredProducts : null,
        allowExtraProducts: allowExtraProducts ?? true,
      },
    });
    return successResponse({ coupon }, "Coupon created", 201);
  } catch { return serverErrorResponse(); }
}
