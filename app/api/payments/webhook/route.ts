import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWebhookSignature } from "@/lib/razorpay";

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-razorpay-signature");
    if (!signature) return NextResponse.json({ error: "No signature" }, { status: 400 });

    const rawBody = await request.text();

    const isValid = verifyWebhookSignature(rawBody, signature);
    if (!isValid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

    const event = JSON.parse(rawBody);
    const { event: eventType, payload } = event;

    if (eventType === "payment.captured") {
      const payment = payload.payment.entity;
      const rzpOrderId = payment.order_id;

      const order = await prisma.order.findFirst({
        where: { razorpayOrderId: rzpOrderId },
        select: { id: true, paymentStatus: true },
      });

      if (order && order.paymentStatus !== "PAID") {
        await prisma.$transaction([
          prisma.order.update({
            where: { id: order.id },
            data: { status: "CONFIRMED", paymentStatus: "PAID", razorpayPaymentId: payment.id },
          }),
          prisma.payment.updateMany({
            where: { orderId: order.id },
            data: { status: "PAID", razorpayPaymentId: payment.id, method: payment.method },
          }),
        ]);
      }
    }

    if (eventType === "payment.failed") {
      const payment = payload.payment.entity;
      const rzpOrderId = payment.order_id;

      const order = await prisma.order.findFirst({
        where: { razorpayOrderId: rzpOrderId },
        select: { id: true, paymentStatus: true },
      });
      if (order && order.paymentStatus === "PENDING") {
        await prisma.$transaction([
          prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: "FAILED" },
          }),
          prisma.payment.updateMany({
            where: { orderId: order.id },
            data: {
              status: "FAILED",
              errorCode: payment.error_code,
              errorDesc: payment.error_description,
            },
          }),
        ]);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
