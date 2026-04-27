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
});

export async function GET() {
  const session = await getServerSession();
  if (!session) return unauthorizedResponse();
  const addresses = await prisma.address.findMany({
    where: { userId: session.userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return successResponse({ addresses });
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) return unauthorizedResponse();
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return errorResponse("VALIDATION_ERROR", parsed.error.errors[0].message);

    // If first address, make it default
    const count = await prisma.address.count({ where: { userId: session.userId } });
    const address = await prisma.address.create({
      data: { ...parsed.data, userId: session.userId, isDefault: count === 0 },
    });
    return successResponse({ address }, "Address saved", 201);
  } catch { return serverErrorResponse(); }
}
