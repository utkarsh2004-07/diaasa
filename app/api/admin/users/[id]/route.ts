import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from "@/lib/response";
import { z } from "zod";

const schema = z.object({
  role: z.enum(["CUSTOMER", "ADMIN"]),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin().catch(() => null);
    if (!session) return unauthorizedResponse();

    const { id } = await params;

    // Prevent admin from changing their own role
    if (session.userId === id)
      return errorResponse("FORBIDDEN", "Cannot change your own role");

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success)
      return errorResponse("VALIDATION_ERROR", parsed.error.errors[0].message);

    const user = await prisma.user.update({
      where: { id },
      data: { role: parsed.data.role },
      select: { id: true, role: true, name: true, phone: true },
    });

    return successResponse({ user }, "User role updated");
  } catch (error) {
    console.error("admin user PATCH error:", error);
    return serverErrorResponse();
  }
}
