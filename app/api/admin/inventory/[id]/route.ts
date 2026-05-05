import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { successResponse, unauthorizedResponse, serverErrorResponse } from "@/lib/response";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin().catch(() => null);
    if (!session) return unauthorizedResponse();

    const { id } = await params;
    const { stock } = await request.json();
    const stockNum = Number(stock);
    if (isNaN(stockNum) || stockNum < 0)
      return successResponse({}, "Invalid stock value");

    const variant = await prisma.productVariant.update({
      where: { id },
      data: { stock: stockNum },
      select: { id: true, stock: true, name: true },
    });

    return successResponse({ variant }, "Stock updated");
  } catch {
    return serverErrorResponse();
  }
}
