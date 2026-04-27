import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { successResponse, unauthorizedResponse, serverErrorResponse } from "@/lib/response";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin().catch(() => null);
    if (!session) return unauthorizedResponse();
    const { slug, title, content, metaTitle, metaDesc } = await request.json();
    const page = await prisma.staticPage.upsert({
      where: { slug },
      update: { title, content, metaTitle: metaTitle || null, metaDesc: metaDesc || null },
      create: { slug, title, content, metaTitle: metaTitle || null, metaDesc: metaDesc || null },
    });
    revalidatePath(`/pages/${slug}`);
    return successResponse({ page }, "Page saved");
  } catch { return serverErrorResponse(); }
}
