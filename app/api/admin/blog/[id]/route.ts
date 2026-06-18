import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { successResponse, unauthorizedResponse, serverErrorResponse, errorResponse } from "@/lib/response";
import { revalidateTag } from "next/cache";
import { TAGS } from "@/lib/cache";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin().catch(() => null);
    if (!session) return unauthorizedResponse();
    const { id } = await params;
    const body = await request.json();
    const { title, slug, excerpt, content, coverImage, status, tags, metaTitle, metaDesc } = body;
    const existing = await prisma.blogPost.findUnique({ where: { id } });
    if (!existing) return errorResponse("NOT_FOUND", "Post not found", 404);
    const wasPublished = existing.status === "PUBLISHED";
    const nowPublished = status === "PUBLISHED";
    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        title, slug, excerpt: excerpt || null, content,
        coverImage: coverImage || null,
        status: status || existing.status,
        tags: tags || null,
        metaTitle: metaTitle || null,
        metaDesc: metaDesc || null,
        publishedAt: nowPublished && !wasPublished ? new Date() : existing.publishedAt,
      },
    });
    revalidateTag(TAGS.blog);
    revalidateTag(TAGS.blogPost(existing.slug));
    return successResponse({ post }, "Updated");
  } catch (e) {
    console.error(e);
    return serverErrorResponse();
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireAdmin().catch(() => null);
    if (!session) return unauthorizedResponse();
    const { id } = await params;
    const post = await prisma.blogPost.findUnique({ where: { id } });
    if (!post) return errorResponse("NOT_FOUND", "Post not found", 404);
    await prisma.blogPost.delete({ where: { id } });
    revalidateTag(TAGS.blog);
    revalidateTag(TAGS.blogPost(post.slug));
    return successResponse(null, "Deleted");
  } catch (e) {
    console.error(e);
    return serverErrorResponse();
  }
}
