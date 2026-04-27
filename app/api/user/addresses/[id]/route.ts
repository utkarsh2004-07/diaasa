import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { successResponse, errorResponse, unauthorizedResponse, serverErrorResponse } from "@/lib/response";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  phone: z.string().regex(/^[6-9]\d{9}$/),
  line1: z.string().min(5),
  line2: z.string().optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/),
  addressType: z.enum(["HOME", "WORK", "OTHER"]).optional(),
  isDefault: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) return unauthorizedResponse();
    const { id } = await params;
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return errorResponse("VALIDATION_ERROR", parsed.error.errors[0].message);

    // Verify ownership
    const existing = await prisma.address.findFirst({ where: { id, userId: session.userId } });
    if (!existing) return errorResponse("NOT_FOUND", "Address not found", 404);

    // If setting as default, unset others first
    if (parsed.data.isDefault) {
      await prisma.address.updateMany({ where: { userId: session.userId }, data: { isDefault: false } });
    }

    const address = await prisma.address.update({ where: { id }, data: parsed.data });
    return successResponse({ address }, "Address updated");
  } catch { return serverErrorResponse(); }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession();
    if (!session) return unauthorizedResponse();
    const { id } = await params;

    const existing = await prisma.address.findFirst({ where: { id, userId: session.userId } });
    if (!existing) return errorResponse("NOT_FOUND", "Address not found", 404);

    await prisma.address.delete({ where: { id } });

    // If deleted address was default, make the next one default
    if (existing.isDefault) {
      const next = await prisma.address.findFirst({ where: { userId: session.userId }, orderBy: { createdAt: "desc" } });
      if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } });
    }

    return successResponse({}, "Address deleted");
  } catch { return serverErrorResponse(); }
}
