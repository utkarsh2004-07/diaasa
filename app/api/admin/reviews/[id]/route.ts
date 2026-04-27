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
    const { status } = await request.json();
    const review = await prisma.review.update({ where: { id }, data: { status } });
    return successResponse({ review }, "Review updated");
  } catch { return serverErrorResponse(); }
}
