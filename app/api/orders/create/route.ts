import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { createRazorpayOrder } from "@/lib/razorpay";
import { calculateCartGST } from "@/lib/gst";
import { checkRateLimit } from "@/lib/ratelimit";
import { sendOrderConfirmedEmail } from "@/lib/email";
import { validateCoupon, calcShipping } from "@/lib/coupon-engine";
import {
  successResponse, errorResponse, unauthorizedResponse, serverErrorResponse,
} from "@/lib/response";
import { z } from "zod";

const schema = z.object({
  addressId: z.string(),
  paymentMethod: z.enum(["ONLINE", "COD"]),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
});

function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `LX-${ts}-${rand}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return unauthorizedResponse();

    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rl = checkRateLimit({ key: `checkout:${session.userId}:${ip}`, limit: 5, windowMs: 60 * 60 * 1000 });
    if (!rl.allowed) return errorResponse("RATE_LIMIT", "Too many orders. Please try again later.", 429);

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success)
      return errorResponse("VALIDATION_ERROR", parsed.error.errors[0].message);

    const { addressId, paymentMethod, couponCode, notes } = parsed.data;

    const address = await prisma.address.findFirst({ where: { id: addressId, userId: session.userId } });
    if (!address) return errorResponse("INVALID_ADDRESS", "Address not found");

    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.userId },
      include: {
        product: { select: { id: true, name: true, gstPercent: true } },
        variant: true,
      },
    });

    if (!cartItems.length) return errorResponse("EMPTY_CART", "Your cart is empty");

    for (const item of cartItems) {
      if (item.variant.stock < item.quantity)
        return errorResponse("INSUFFICIENT_STOCK", `Insufficient stock for ${item.product.name}`);
    }

    const gstSummary = calculateCartGST(
      cartItems.map((i) => ({
        name: i.product.name,
        price: i.variant.price,
        quantity: i.quantity,
        gstPercent: i.product.gstPercent,
      }))
    );

    // ── Server-side coupon re-validation — NEVER trust frontend discount ──
    let discountAmount = 0;
    let couponId: string | null = null;

    if (couponCode) {
      const couponResult = await validateCoupon(
        couponCode,
        cartItems.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
        session.userId
      );
      if (!couponResult.valid)
        return errorResponse(couponResult.errorCode || "INVALID_COUPON", couponResult.error || "Invalid coupon");

      discountAmount = couponResult.discount;
      const coupon = await prisma.coupon.findUnique({ where: { code: couponCode.toUpperCase() }, select: { id: true } });
      couponId = coupon?.id || null;
    }

    const shippingAmount = calcShipping(gstSummary.subtotal);
    const total = Math.max(gstSummary.totalWithGST + shippingAmount - discountAmount, 0);

    const orderItemsData = cartItems.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      name: item.product.name,
      variantName: item.variant.name,
      price: item.variant.price,
      quantity: item.quantity,
      gstPercent: item.product.gstPercent,
      gstAmount: (item.variant.price * item.quantity * item.product.gstPercent) / 100,
      total: item.variant.price * item.quantity,
      imageUrl: null,
    }));

    // ── COD ──────────────────────────────────────────────────────────────────
    if (paymentMethod === "COD") {
      const order = await prisma.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
          data: {
            orderNumber: generateOrderNumber(),
            userId: session.userId,
            addressId,
            paymentMethod: "COD",
            status: "CONFIRMED",
            paymentStatus: "PENDING",
            subtotal: gstSummary.subtotal,
            gstAmount: gstSummary.totalGST,
            shippingAmount,
            discountAmount,
            total,
            couponCode: couponCode?.toUpperCase(),
            couponId,
            notes,
            items: { create: orderItemsData },
          },
        });

        for (const item of cartItems) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        }

        if (couponId) {
          await tx.coupon.update({ where: { id: couponId }, data: { usedCount: { increment: 1 } } });
        }

        await tx.cartItem.deleteMany({ where: { userId: session.userId } });
        return newOrder;
      });

      prisma.user.findUnique({ where: { id: session.userId }, select: { email: true, name: true } })
        .then((user) => {
          if (user?.email) {
            sendOrderConfirmedEmail({
              to: user.email,
              name: user.name || "Customer",
              orderNumber: order.orderNumber,
              orderId: order.id,
              total: order.total,
              paymentMethod: "Cash on Delivery",
              items: cartItems.map((i) => ({ name: i.product.name, quantity: i.quantity, total: i.variant.price * i.quantity })),
            }).catch(() => {});
          }
        }).catch(() => {});

      return successResponse(
        { orderId: order.id, orderNumber: order.orderNumber, paymentMethod: "COD" },
        "Order placed successfully"
      );
    }

    // ── ONLINE ───────────────────────────────────────────────────────────────
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: session.userId,
        addressId,
        paymentMethod: "ONLINE",
        subtotal: gstSummary.subtotal,
        gstAmount: gstSummary.totalGST,
        shippingAmount,
        discountAmount,
        total,
        couponCode: couponCode?.toUpperCase(),
        couponId,
        notes,
        items: { create: orderItemsData },
      },
    });

    const rzpOrder = await createRazorpayOrder({
      amount: Math.max(total, 1),
      currency: "INR",
      receipt: order.orderNumber,
      notes: { orderId: order.id, userId: session.userId },
    });

    await Promise.all([
      prisma.order.update({ where: { id: order.id }, data: { razorpayOrderId: rzpOrder.id } }),
      prisma.payment.create({
        data: { orderId: order.id, razorpayOrderId: rzpOrder.id, amount: total, currency: "INR", status: "PENDING" },
      }),
    ]);

    return successResponse({
      orderId: order.id,
      orderNumber: order.orderNumber,
      razorpayOrderId: rzpOrder.id,
      amount: total,
      currency: "INR",
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    }, "Order created");

  } catch (error) {
    console.error("create-order error:", error);
    return serverErrorResponse();
  }
}
