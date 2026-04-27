import { prisma } from "@/lib/prisma";
import { successResponse, serverErrorResponse } from "@/lib/response";
import { unstable_cache } from "next/cache";
import { TAGS } from "@/lib/cache";

const getPosts = unstable_cache(
  async () => prisma.socialPost.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  }),
  [TAGS.socialPosts],
  { revalidate: 86400, tags: [TAGS.socialPosts] }
);

export async function GET() {
  try {
    const posts = await getPosts();
    return successResponse({ posts });
  } catch { return serverErrorResponse(); }
}
