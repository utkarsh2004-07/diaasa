import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { trackShipment } from "@/lib/shiprocket";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) return errorResponse("UNAUTHORIZED", "Login required", 401);

    const { id } = await params;
    const isAdmin = ["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(session.role);

    const order = await prisma.order.findFirst({
      where: isAdmin ? { id } : { id, userId: session.userId },
      select: { awbCode: true, trackingUrl: true, status: true, shiprocketOrderId: true },
    });

    if (!order) return errorResponse("NOT_FOUND", "Order not found", 404);
    if (!order.awbCode) return successResponse({ tracking: null, status: order.status }, "No tracking available yet");

    // Get live tracking from Shiprocket
    const tracking = await trackShipment(order.awbCode);

    return successResponse({
      awbCode: order.awbCode,
      trackingUrl: order.trackingUrl,
      tracking: tracking?.tracking_data || null,
      status: order.status,
    });
  } catch (error) {
    console.error("Track error:", error);
    return serverErrorResponse();
  }
}
