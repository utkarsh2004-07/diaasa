import { prisma } from "@/lib/prisma";
import { successResponse, serverErrorResponse } from "@/lib/response";
import { unstable_cache } from "next/cache";
import { TAGS } from "@/lib/cache";

const getCategories = unstable_cache(
  async () => prisma.category.findMany({
    where: { isActive: true },
    select: { id: true, name: true, slug: true, image: true, parentId: true, sortOrder: true },
    orderBy: { sortOrder: "asc" },
  }),
  [TAGS.categories],
  { revalidate: 86400, tags: [TAGS.categories] }
);

export async function GET() {
  try {
    const categories = await getCategories();
    return successResponse({ categories });
  } catch { return serverErrorResponse(); }
}
