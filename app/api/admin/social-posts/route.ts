import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { successResponse, unauthorizedResponse, serverErrorResponse, errorResponse } from "@/lib/response";
import { revalidateTag } from "next/cache";
import { TAGS } from "@/lib/cache";

export async function GET() {
  try {
    const session = await requireAdmin().catch(() => null);
    if (!session) return unauthorizedResponse();
    const posts = await prisma.socialPost.findMany({ orderBy: { sortOrder: "asc" } });
    return successResponse({ posts });
  } catch { return serverErrorResponse(); }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin().catch(() => null);
    if (!session) return unauthorizedResponse();
    const body = await request.json();
    const { type, url, link, caption, sortOrder } = body;
    if (!url) return errorResponse("VALIDATION_ERROR", "URL is required");
    const post = await prisma.socialPost.create({
      data: { type: type || "IMAGE", url, link: link || null, caption: caption || null, sortOrder: sortOrder || 0 },
    });
    revalidateTag(TAGS.socialPosts);
    return successResponse({ post }, "Post added", 201);
  } catch { return serverErrorResponse(); }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAdmin().catch(() => null);
    if (!session) return unauthorizedResponse();
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) return errorResponse("VALIDATION_ERROR", "id is required");
    const post = await prisma.socialPost.update({ where: { id }, data });
    revalidateTag(TAGS.socialPosts);
    return successResponse({ post }, "Post updated");
  } catch { return serverErrorResponse(); }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAdmin().catch(() => null);
    if (!session) return unauthorizedResponse();
    const id = new URL(request.url).searchParams.get("id");
    if (!id) return errorResponse("VALIDATION_ERROR", "id is required");
    await prisma.socialPost.delete({ where: { id } });
    revalidateTag(TAGS.socialPosts);
    return successResponse({}, "Post deleted");
  } catch { return serverErrorResponse(); }
}
