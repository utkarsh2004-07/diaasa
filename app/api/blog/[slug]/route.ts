import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse, serverErrorResponse } from "@/lib/response";
import { unstable_cache } from "next/cache";
import { TAGS } from "@/lib/cache";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const getPost = unstable_cache(
      async () => prisma.blogPost.findFirst({
        where: { slug, status: "PUBLISHED" },
        include: { author: { select: { name: true, avatar: true } } },
      }),
      [`blog-post-${slug}`],
      { revalidate: 3600, tags: [TAGS.blog, TAGS.blogPost(slug)] }
    );
    const post = await getPost();
    if (!post) return errorResponse("NOT_FOUND", "Post not found", 404);
    return successResponse(post);
  } catch { return serverErrorResponse(); }
}
