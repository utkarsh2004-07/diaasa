import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { createRazorpayOrder } from "@/lib/razorpay";
import { calculateCartGST } from "@/lib/gst";
import { checkRateLimit } from "@/lib/ratelimit";
import { sendOrderConfirmedEmail } from "@/lib/email";
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

    // Rate limit: max 5 orders per user per hour
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const rl = checkRateLimit({ key: `checkout:${session.userId}:${ip}`, limit: 5, windowMs: 60 * 60 * 1000 });
    if (!rl.allowed) return errorResponse("RATE_LIMIT", "Too many orders. Please try again later.", 429);

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success)
      return errorResponse("VALIDATION_ERROR", parsed.error.errors[0].message);

    const { addressId, paymentMethod, couponCode, notes } = parsed.data;

    // Validate address belongs to user
    const address = await prisma.address.findFirst({
      where: { id: addressId, userId: session.userId },
    });
    if (!address) return errorResponse("INVALID_ADDRESS", "Address not found");

    // Get cart items
    const cartItems = await prisma.cartItem.findMany({
      where: { userId: session.userId },
      include: {
        product: { select: { id: true, name: true, gstPercent: true } },
        variant: true,
      },
    });

    if (!cartItems.length) return errorResponse("EMPTY_CART", "Your cart is empty");

    // Validate stock
    for (const item of cartItems) {
      if (item.variant.stock < item.quantity) {
        return errorResponse("INSUFFICIENT_STOCK", `Insufficient stock for ${item.product.name}`);
      }
    }

    // GST calculation
    const gstSummary = calculateCartGST(
      cartItems.map((i) => ({
        name: i.product.name,
        price: i.variant.price,
        quantity: i.quantity,
        gstPercent: i.product.gstPercent,
      }))
    );

    let discountAmount = 0;
    let couponId: string | null = null;

    // Apply coupon
    if (couponCode) {
      const coupon = await prisma.coupon.findFirst({
        where: {
          code: couponCode.toUpperCase(),
          isActive: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });

      if (!coupon) return errorResponse("INVALID_COUPON", "Invalid or expired coupon");
      if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
        return errorResponse("COUPON_EXHAUSTED", "Coupon usage limit reached");
      if (gstSummary.subtotal < coupon.minCartValue)
        return errorResponse("COUPON_MIN_VALUE", `Minimum order value ₹${coupon.minCartValue} required`);

      discountAmount = coupon.type === "PERCENTAGE"
        ? Math.min((gstSummary.subtotal * coupon.value) / 100, coupon.maxDiscount || Infinity)
        : coupon.value;

      couponId = coupon.id;
    }

    const shippingAmount = gstSummary.subtotal >= 500 ? 0 : 49;
    const total = gstSummary.totalWithGST + shippingAmount - discountAmount;

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
            total: Math.max(total, 0),
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
          await tx.coupon.update({
            where: { id: couponId },
            data: { usedCount: { increment: 1 } },
          });
        }

        await tx.cartItem.deleteMany({ where: { userId: session.userId } });
        return newOrder;
      });

      // Send confirmation email — fire and forget
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
    // Create order only — do NOT deduct stock yet (deduct after payment verified)
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
        total: Math.max(total, 0),
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
      prisma.order.update({
        where: { id: order.id },
        data: { razorpayOrderId: rzpOrder.id },
      }),
      prisma.payment.create({
        data: {
          orderId: order.id,
          razorpayOrderId: rzpOrder.id,
          amount: total,
          currency: "INR",
          status: "PENDING",
        },
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
