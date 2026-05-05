import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from "@/lib/response";
import { revalidateTag } from "next/cache";
import { TAGS } from "@/lib/cache";

export async function GET() {
  try {
    const session = await requireAdmin().catch(() => null);
    if (!session) return unauthorizedResponse();
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { sortOrder: "asc" },
    });
    return successResponse({ categories });
  } catch { return serverErrorResponse(); }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin().catch(() => null);
    if (!session) return unauthorizedResponse();
    const body = await request.json();
    const { name, slug, description, image, isActive, sortOrder, parentId } = body;
    if (!name || !slug) return errorResponse("VALIDATION_ERROR", "Name and slug are required");
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) return errorResponse("DUPLICATE_SLUG", "Slug already exists");
    const category = await prisma.category.create({
      data: {
        name, slug,
        description: description || null,
        image: image || null,
        isActive: isActive ?? true,
        sortOrder: Number(sortOrder) || 0,
        parentId: parentId || null,
      },
    });
    revalidateTag(TAGS.categories, "max");
    revalidateTag(TAGS.products, "max");
    return successResponse({ category }, "Category created", 201);
  } catch { return serverErrorResponse(); }
}
