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
    const category = await prisma.category.update({ where: { id }, data: body });
    revalidateTag(TAGS.categories);
    revalidateTag(TAGS.products);
    return successResponse({ category }, "Category updated");
  } catch { return serverErrorResponse(); }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin().catch(() => null);
    if (!session) return unauthorizedResponse();
    const { id } = await params;
    await prisma.category.delete({ where: { id } });
    revalidateTag(TAGS.categories);
    revalidateTag(TAGS.products);
    return successResponse({}, "Category deleted");
  } catch { return serverErrorResponse(); }
}
