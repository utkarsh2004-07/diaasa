import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Shiprocket shipment status codes → our OrderStatus
const STATUS_MAP: Record<string, string> = {
  "6":  "SHIPPED",    // Shipped
  "7":  "DELIVERED",  // Delivered
  "8":  "CANCELLED",  // Cancelled
  "9":  "CANCELLED",  // RTO initiated
  "10": "CANCELLED",  // RTO delivered
  "12": "SHIPPED",    // Out for delivery
  "14": "SHIPPED",    // Pickup scheduled
  "17": "SHIPPED",    // Pickup queued
  "19": "SHIPPED",    // Pickup error (keep as shipped)
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Shiprocket sends: awb, current_status, current_status_id, order_id, shipment_id
    const awb = body?.awb || body?.data?.awb;
    const statusId = String(body?.current_status_id || body?.data?.current_status_id || "");
    const currentStatus = body?.current_status || body?.data?.current_status || "";

    if (!awb) {
      return NextResponse.json({ success: false, message: "No AWB in payload" }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: { awbCode: awb },
      select: { id: true, status: true },
    });

    if (!order) {
      return NextResponse.json({ success: true, message: "Order not found for AWB, ignoring" });
    }

    const newStatus = STATUS_MAP[statusId];

    if (newStatus && newStatus !== order.status) {
      await prisma.order.update({
        where: { id: order.id },
        data: { status: newStatus as any },
      });
    }

    console.log(`Shiprocket webhook: AWB=${awb} status="${currentStatus}" (${statusId}) → ${newStatus || "no change"}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Shiprocket webhook error:", error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
