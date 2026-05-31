import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { generateManifest, printManifest } from "@/lib/shiprocket";
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
      select: { shiprocketShipmentId: true, shiprocketOrderId: true },
    });

    if (!order) return errorResponse("NOT_FOUND", "Order not found", 404);
    if (!order.shiprocketShipmentId)
      return errorResponse("NOT_SHIPPED", "Order not yet shipped via Shiprocket");

    const shipmentId = Number(order.shiprocketShipmentId);
    const orderId = Number(order.shiprocketOrderId);

    await generateManifest([shipmentId]);
    const printResult = await printManifest([orderId]);
    const manifestUrl = printResult?.manifest_url || printResult?.response?.manifest_url || null;

    return successResponse({ manifestUrl }, "Manifest generated");
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to generate manifest";
    return serverErrorResponse(msg);
  }
}
