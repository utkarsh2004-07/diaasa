import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { successResponse, serverErrorResponse } from "@/lib/response";
import { unstable_cache } from "next/cache";
import { TAGS } from "@/lib/cache";

const getBanners = unstable_cache(
  async (type: string) => {
    const now = new Date();
    return prisma.banner.findMany({
      where: {
        type: type as "HERO" | "CATEGORY" | "PROMO" | "POPUP",
        isActive: true,
        OR: [{ startsAt: null }, { startsAt: { lte: now } }],
        AND: [{ OR: [{ endsAt: null }, { endsAt: { gt: now } }] }],
      },
      orderBy: { priority: "asc" },
    });
  },
  [TAGS.banners],
  { revalidate: 86400, tags: [TAGS.banners] }
);

export async function GET(request: NextRequest) {
  try {
    const type = new URL(request.url).searchParams.get("type") || "HERO";
    const banners = await getBanners(type);
    return successResponse({ banners });
  } catch (error) {
    console.error("banners GET error:", error);
    return serverErrorResponse();
  }
}
