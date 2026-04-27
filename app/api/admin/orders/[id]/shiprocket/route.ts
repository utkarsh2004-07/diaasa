import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createShiprocketOrder, assignAWB, generatePickup } from "@/lib/shiprocket";
import { sendOrderShippedEmail } from "@/lib/email";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/response";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAuth();
    if (!["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(session.role)) {
      return errorResponse("UNAUTHORIZED", "Admin access required", 403);
    }

    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { include: { variant: { select: { sku: true, weight: true } } } },
        user: true,
        address: true,
      },
    });

    if (!order) return errorResponse("NOT_FOUND", "Order not found", 404);
    if (!order.address) return errorResponse("NO_ADDRESS", "Order has no delivery address");
    if (order.shiprocketOrderId && order.shiprocketOrderId !== "undefined") {
      return errorResponse("ALREADY_SHIPPED", "Shiprocket order already created");
    }

    // Create order on Shiprocket
    const srOrder = await createShiprocketOrder({
      orderId: order.id,
      orderNumber: order.orderNumber,
      orderDate: order.createdAt,
      customer: {
        name: order.address.name,
        phone: order.address.phone,
        email: order.user.email || undefined,
      },
      address: {
        line1: order.address.line1,
        line2: order.address.line2 || undefined,
        city: order.address.city,
        state: order.address.state,
        pincode: order.address.pincode,
      },
      items: order.items.map((item) => ({
        name: item.name,
        sku: item.variant.sku || item.variantId,
        quantity: item.quantity,
        price: item.price,
        weight: item.variant.weight || 0.5,
      })),
      subtotal: order.subtotal,
      paymentMethod: order.paymentMethod as "COD" | "ONLINE",
      total: order.total,
    });

    // Shiprocket returns order_id and shipment_id at top level
    const shipmentId = srOrder.shipment_id || srOrder.payload?.shipment_id;
    const shiprocketOrderId = String(srOrder.order_id || srOrder.payload?.order_id || "");

    if (!shiprocketOrderId || shiprocketOrderId === "undefined") {
      throw new Error("Shiprocket did not return a valid order_id. Response: " + JSON.stringify(srOrder));
    }

    // Auto-assign AWB (best courier)
    let awbCode: string | undefined;
    let trackingUrl: string | undefined;
    try {
      const awbRes = await assignAWB(shipmentId);
      awbCode = awbRes.response?.data?.awb_code;
      trackingUrl = awbCode ? `https://shiprocket.co/tracking/${awbCode}` : undefined;

      // Generate pickup request
      await generatePickup([shipmentId]);
    } catch (awbError) {
      console.error("AWB assignment error:", awbError);
      // Continue even if AWB fails — can retry from admin
    }

    // Update order in DB
    await prisma.order.update({
      where: { id },
      data: {
        shiprocketOrderId,
        shiprocketShipmentId: String(shipmentId),
        awbCode: awbCode || null,
        trackingUrl: trackingUrl || null,
        status: "SHIPPED",
      },
    });

    // Send shipped email to customer
    if (order.user.email) {
      sendOrderShippedEmail({
        to: order.user.email,
        name: order.user.name || "Customer",
        orderNumber: order.orderNumber,
        orderId: order.id,
        trackingNumber: awbCode,
        trackingUrl,
      }).catch(() => {});
    }

    return successResponse({
      shiprocketOrderId,
      shipmentId,
      awbCode,
      trackingUrl,
    }, awbCode ? `Order shipped! AWB: ${awbCode}` : "Order created on Shiprocket. AWB will be assigned shortly.");
  } catch (error: any) {
    console.error("Shiprocket error:", error);
    return errorResponse("SHIPROCKET_ERROR", error.message || "Failed to create Shiprocket order", 500);
  }
}
