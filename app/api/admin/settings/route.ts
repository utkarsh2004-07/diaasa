import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { successResponse, unauthorizedResponse, serverErrorResponse } from "@/lib/response";

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin().catch(() => null);
    if (!session) return unauthorizedResponse();
    const { settings } = await request.json();
    await Promise.all(
      Object.entries(settings as Record<string, string>).map(([key, value]) =>
        prisma.setting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      )
    );
    return successResponse({}, "Settings saved");
  } catch { return serverErrorResponse(); }
}
