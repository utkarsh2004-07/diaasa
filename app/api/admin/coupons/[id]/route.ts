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
    const body = await request.json();
    const coupon = await prisma.coupon.update({ where: { id }, data: body });
    return successResponse({ coupon }, "Coupon updated");
  } catch { return serverErrorResponse(); }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin().catch(() => null);
    if (!session) return unauthorizedResponse();
    const { id } = await params;
    await prisma.coupon.delete({ where: { id } });
    return successResponse({}, "Coupon deleted");
  } catch { return serverErrorResponse(); }
}
