import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { successResponse, unauthorizedResponse, serverErrorResponse } from "@/lib/response";
import { revalidateTag } from "next/cache";
import { TAGS } from "@/lib/cache";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin().catch(() => null);
    if (!session) return unauthorizedResponse();
    const { id } = await params;
    const body = await request.json();
    const banner = await prisma.banner.update({ where: { id }, data: body });
    revalidateTag(TAGS.banners, "max");
    return successResponse({ banner });
  } catch { return serverErrorResponse(); }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin().catch(() => null);
    if (!session) return unauthorizedResponse();
    const { id } = await params;
    await prisma.banner.delete({ where: { id } });
    revalidateTag(TAGS.banners, "max");
    return successResponse({}, "Banner deleted");
  } catch { return serverErrorResponse(); }
}
