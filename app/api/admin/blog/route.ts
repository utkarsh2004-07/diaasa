import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { successResponse, unauthorizedResponse, serverErrorResponse, errorResponse } from "@/lib/response";
import { revalidateTag } from "next/cache";
import { TAGS } from "@/lib/cache";

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin().catch(() => null);
    if (!session) return unauthorizedResponse();
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || 1);
    const q = searchParams.get("q") || "";
    const where = q ? { title: { contains: q } } : {};
    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where,
        include: { author: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * 20,
        take: 20,
      }),
      prisma.blogPost.count({ where }),
    ]);
    return successResponse({ posts, total, page, pages: Math.ceil(total / 20) });
  } catch { return serverErrorResponse(); }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin().catch(() => null);
    if (!session) return unauthorizedResponse();
    const body = await request.json();
    const { title, slug, excerpt, content, coverImage, status, tags, metaTitle, metaDesc } = body;
    if (!title || !slug || !content) return errorResponse("VALIDATION_ERROR", "title, slug and content are required");
    const post = await prisma.blogPost.create({
      data: {
        title, slug, excerpt: excerpt || null, content,
        coverImage: coverImage || null,
        authorId: session.userId,
        status: status || "DRAFT",
        tags: tags || null,
        metaTitle: metaTitle || null,
        metaDesc: metaDesc || null,
        publishedAt: status === "PUBLISHED" ? new Date() : null,
      },
    });
    revalidateTag(TAGS.blog, "max");
    return successResponse({ post }, "Blog post created", 201);
  } catch (e) {
    console.error(e);
    return serverErrorResponse();
  }
}
