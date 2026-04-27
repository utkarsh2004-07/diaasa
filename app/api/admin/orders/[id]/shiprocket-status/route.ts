import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/response";
import { trackByOrderId } from "@/lib/shiprocket";

export async function GET(
  _req: NextRequest,
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
      select: { shiprocketOrderId: true, awbCode: true, orderNumber: true },
    });

    if (!order) return errorResponse("NOT_FOUND", "Order not found", 404);
    if (!order.shiprocketOrderId || order.shiprocketOrderId === "undefined") {
      return errorResponse("NOT_SHIPPED", "Order not yet shipped via Shiprocket — shiprocketOrderId is missing");
    }

    const srData = await trackByOrderId(order.shiprocketOrderId);

    // extract useful fields from Shiprocket response
    const shipment = srData?.data?.shipments?.[0] || srData?.data || srData;
    const awb = shipment?.awb || shipment?.awb_code || order.awbCode || null;
    const status = shipment?.status || shipment?.shipment_status || "Unknown";
    const courier = shipment?.courier || shipment?.courier_name || "—";
    const city = shipment?.city || "—";
    const etd = shipment?.etd || shipment?.expected_delivery_date || "—";

    // if AWB was just assigned, save it to DB
    if (awb && !order.awbCode) {
      await prisma.order.update({
        where: { id },
        data: {
          awbCode: awb,
          trackingUrl: `https://shiprocket.co/tracking/${awb}`,
        },
      });
    }

    return successResponse({ awb, status, courier, city, etd, raw: srData });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to fetch Shiprocket status";
    console.error("Shiprocket status error:", error);
    return serverErrorResponse(msg);
  }
}
