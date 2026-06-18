import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, serverErrorResponse } from "@/lib/response";
import { unstable_cache } from "next/cache";
import { TAGS } from "@/lib/cache";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") || 1);
    const limit = Number(searchParams.get("limit") || 9);

    const getPosts = unstable_cache(
      async () => {
        const [posts, total] = await Promise.all([
          prisma.blogPost.findMany({
            where: { status: "PUBLISHED" },
            select: {
              id: true, title: true, slug: true, excerpt: true,
              coverImage: true, tags: true, publishedAt: true, createdAt: true,
              author: { select: { name: true } },
            },
            orderBy: { publishedAt: "desc" },
            skip: (page - 1) * limit,
            take: limit,
          }),
          prisma.blogPost.count({ where: { status: "PUBLISHED" } }),
        ]);
        return { posts, total, pages: Math.ceil(total / limit) };
      },
      [`blog-list-${page}-${limit}`],
      { revalidate: 3600, tags: [TAGS.blog] }
    );

    const data = await getPosts();
    return successResponse(data);
  } catch { return serverErrorResponse(); }
}
