import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from "@/lib/response";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) return unauthorizedResponse();
    const { id } = await params;

    const order = await prisma.order.findFirst({
      where: { id, userId: session.userId },
      select: { id: true, status: true, paymentMethod: true, paymentStatus: true },
    });

    if (!order) return errorResponse("NOT_FOUND", "Order not found", 404);

    const cancellable = ["PENDING", "CONFIRMED", "PROCESSING"];
    if (!cancellable.includes(order.status)) {
      return errorResponse("CANNOT_CANCEL", "Order cannot be cancelled at this stage");
    }

    await prisma.order.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    return successResponse({}, "Order cancelled successfully");
  } catch { return serverErrorResponse(); }
}
