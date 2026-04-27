import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { sendOrderShippedEmail } from "@/lib/email";
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from "@/lib/response";
import { z } from "zod";

const schema = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin().catch(() => null);
    if (!session) return unauthorizedResponse();

    const { id } = await params;
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success)
      return errorResponse("VALIDATION_ERROR", parsed.error.errors[0].message);

    const order = await prisma.order.update({
      where: { id },
      data: { status: parsed.data.status },
      include: { user: { select: { email: true, name: true } } },
    });

    // Send shipped email when status changes to SHIPPED
    if (parsed.data.status === "SHIPPED" && order.user.email) {
      sendOrderShippedEmail({
        to: order.user.email,
        name: order.user.name || "Customer",
        orderNumber: order.orderNumber,
        orderId: order.id,
      }).catch(() => {});
    }

    return successResponse({ order }, "Order status updated");
  } catch (error) {
    console.error("admin order PATCH error:", error);
    return serverErrorResponse();
  }
}
