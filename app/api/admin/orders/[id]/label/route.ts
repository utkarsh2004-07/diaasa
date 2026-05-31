import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { generateLabel } from "@/lib/shiprocket";
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
      select: { shiprocketShipmentId: true, orderNumber: true },
    });

    if (!order) return errorResponse("NOT_FOUND", "Order not found", 404);
    if (!order.shiprocketShipmentId)
      return errorResponse("NOT_SHIPPED", "Order not yet shipped via Shiprocket");

    const result = await generateLabel([Number(order.shiprocketShipmentId)]);
    const labelUrl = result?.label_url || result?.response?.label_url || null;

    return successResponse({ labelUrl }, "Shipping label generated");
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to generate label";
    return serverErrorResponse(msg);
  }
}
