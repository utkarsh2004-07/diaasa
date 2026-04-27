import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { verifyRazorpaySignature } from "@/lib/razorpay";
import { sendOrderConfirmedEmail } from "@/lib/email";
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from "@/lib/response";
import { z } from "zod";

const schema = z.object({
  orderId: z.string(),
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return unauthorizedResponse();

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success)
      return errorResponse("VALIDATION_ERROR", parsed.error.errors[0].message);

    const { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = parsed.data;

    // Fetch order
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: session.userId },
      include: {
        items: true,
        user: true,
        address: true,
        coupon: { select: { id: true } },
      },
    });

    if (!order) return errorResponse("ORDER_NOT_FOUND", "Order not found");
    if (order.paymentStatus === "PAID") return successResponse({ alreadyPaid: true }, "Payment already verified");

    // Verify signature
    const isValid = verifyRazorpaySignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValid) {
      await prisma.order.update({
        where: { id: orderId },
        data: { status: "PENDING", paymentStatus: "FAILED" },
      });
      await prisma.payment.updateMany({
        where: { orderId },
        data: { status: "FAILED", errorDesc: "Signature verification failed" },
      });
      return errorResponse("PAYMENT_FAILED", "Payment verification failed");
    }

    // Update order + deduct stock + clear cart + increment coupon in one transaction
    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: "CONFIRMED",
          paymentStatus: "PAID",
          razorpayPaymentId,
          razorpaySignature,
        },
      });

      await tx.payment.updateMany({
        where: { orderId },
        data: { status: "PAID", razorpayPaymentId, razorpaySignature },
      });

      // Deduct stock now that payment is confirmed
      for (const item of order.items) {
        await tx.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Increment coupon usage if applied
      if (order.couponId) {
        await tx.coupon.update({
          where: { id: order.couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      // Clear user cart
      await tx.cartItem.deleteMany({ where: { userId: session.userId } });
    });

    // Send confirmation email (fire and forget) — invoice generated on-demand via /api/invoice/[orderId]
    if (order.user.email) {
      sendOrderConfirmedEmail({
        to: order.user.email,
        name: order.user.name || "Customer",
        orderNumber: order.orderNumber,
        orderId: order.id,
        total: order.total,
        paymentMethod: "Online Payment",
        items: order.items.map((i) => ({ name: i.name, quantity: i.quantity, total: i.total })),
      }).catch(() => {});
    }

    return successResponse({
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: "CONFIRMED",
    }, "Payment verified successfully!");
  } catch (error) {
    console.error("verify-payment error:", error);
    return serverErrorResponse();
  }
}
