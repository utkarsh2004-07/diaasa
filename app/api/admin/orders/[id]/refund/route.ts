import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from "@/lib/response";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin().catch(() => null);
    if (!session) return unauthorizedResponse();

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      select: {
        id: true, total: true,
        paymentStatus: true, paymentMethod: true,
        status: true, razorpayPaymentId: true,
      },
    });

    if (!order) return errorResponse("NOT_FOUND", "Order not found", 404);
    if (order.paymentStatus === "REFUNDED") return errorResponse("ALREADY_REFUNDED", "Order already refunded");
    if (order.paymentStatus !== "PAID") return errorResponse("NOT_PAID", "Order is not paid yet");
    if (order.paymentMethod !== "ONLINE") return errorResponse("INVALID", "Refund only applicable for online payments");
    if (!order.razorpayPaymentId) return errorResponse("NO_PAYMENT_ID", "Razorpay payment ID not found");

    // Call Razorpay refund API directly
    const Razorpay = (await import("razorpay")).default;
    const rzp = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID!,
      key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    await rzp.payments.refund(order.razorpayPaymentId, {
      amount: Math.round(order.total * 100),
    });

    await Promise.all([
      prisma.order.update({
        where: { id },
        data: { paymentStatus: "REFUNDED", status: "REFUNDED" },
      }),
      prisma.payment.updateMany({
        where: { orderId: id },
        data: { status: "REFUNDED" },
      }),
    ]);

    return successResponse({}, "Refund initiated. Amount will be credited in 5-7 business days.");
  } catch (error: unknown) {
    console.error("Refund error:", error);
    return serverErrorResponse();
  }
}
