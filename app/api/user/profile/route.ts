import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { successResponse, unauthorizedResponse, serverErrorResponse } from "@/lib/response";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return unauthorizedResponse();
    const { name, email } = await request.json();
    const user = await prisma.user.update({
      where: { id: session.userId },
      data: { name: name || null, email: email || null },
      select: { id: true, name: true, email: true, phone: true },
    });
    return successResponse({ user }, "Profile updated");
  } catch { return serverErrorResponse(); }
}
