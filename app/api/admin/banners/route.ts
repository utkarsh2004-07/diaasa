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
    const banners = await prisma.banner.findMany({ orderBy: [{ type: "asc" }, { priority: "asc" }] });
    return successResponse({ banners });
  } catch { return serverErrorResponse(); }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin().catch(() => null);
    if (!session) return unauthorizedResponse();
    const body = await request.json();
    const { title, image, mobileImage, link, type, isActive, priority, startsAt, endsAt } = body;
    if (!image) return errorResponse("VALIDATION_ERROR", "Image is required");
    const banner = await prisma.banner.create({
      data: {
        title, image,
        mobileImage: mobileImage || null,
        link: link || null,
        type: type || "HERO",
        isActive: isActive ?? true,
        priority: Number(priority) || 0,
        startsAt: startsAt ? new Date(startsAt) : null,
        endsAt: endsAt ? new Date(endsAt) : null,
      },
    });
    revalidateTag(TAGS.banners, "max");
    return successResponse({ banner }, "Banner created", 201);
  } catch { return serverErrorResponse(); }
}
