import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/response";
import { z } from "zod";

const schema = z.object({
  paymentStatus: z.enum(["PENDING", "PAID", "FAILED"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!session || !["ADMIN", "SUPER_ADMIN"].includes(session.role)) {
      return errorResponse("UNAUTHORIZED", "Admin access required", 403);
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = schema.safeParse(body);
    
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", parsed.error.errors[0].message);
    }

    const { paymentStatus } = parsed.data;

    // Update order payment status
    const order = await prisma.order.update({
      where: { id },
      data: { paymentStatus },
      include: {
        payment: true,
      },
    });

    // Also update payment record if exists
    if (order.payment) {
      await prisma.payment.update({
        where: { orderId: id },
        data: { status: paymentStatus },
      });
    }

    return successResponse({ order }, "Payment status updated successfully");
  } catch (error) {
    console.error("Payment status update error:", error);
    return serverErrorResponse();
  }
}