import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Call via cron: GET /api/cron/cleanup
// Header: Authorization: Bearer <CRON_SECRET>
export async function GET(request: NextRequest) {
  const secret = request.headers.get("authorization")?.replace("Bearer ", "");
  if (secret !== process.env.CRON_SECRET)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [guestCarts, otpRequests] = await Promise.all([
    prisma.cartItem.deleteMany({ where: { userId: null, createdAt: { lt: sevenDaysAgo } } }),
    prisma.otpRequest.deleteMany({ where: { expiresAt: { lt: oneDayAgo } } }),
  ]);

  return NextResponse.json({ success: true, deletedGuestCarts: guestCarts.count, deletedOtpRequests: otpRequests.count });
}
