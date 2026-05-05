import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { refundPayment } from "@/lib/razorpay";
import { cancelShiprocketOrder } from "@/lib/shiprocket";
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from "@/lib/response";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) return unauthorizedResponse();
    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: { id, userId: session.userId },
      select: {
        id: true, status: true, paymentMethod: true, paymentStatus: true,
        razorpayPaymentId: true, total: true, shiprocketOrderId: true,
        items: { select: { variantId: true, quantity: true } },
      },
    });

    if (!order) return errorResponse("NOT_FOUND", "Order not found", 404);

    const cancellable = ["PENDING", "CONFIRMED", "PROCESSING"];
    if (!cancellable.includes(order.status))
      return errorResponse("CANNOT_CANCEL", "Order cannot be cancelled at this stage");

    // Cancel + restore stock atomically
    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id }, data: { status: "CANCELLED" } });
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      }
    });

    // Cancel on Shiprocket if already pushed there (fire and forget)
    if (order.shiprocketOrderId) {
      cancelShiprocketOrder([Number(order.shiprocketOrderId)])
        .catch((e) => console.error("Shiprocket cancel failed:", e));
    }

    // Razorpay refund for paid online orders (fire and forget)
    if (order.paymentMethod === "ONLINE" && order.paymentStatus === "PAID" && order.razorpayPaymentId) {
      refundPayment(order.razorpayPaymentId, order.total)
        .then(() => prisma.order.update({ where: { id }, data: { paymentStatus: "REFUNDED" } }))
        .catch((e) => console.error("Refund failed:", e));
    }

    return successResponse({}, "Order cancelled successfully");
  } catch { return serverErrorResponse(); }
}
