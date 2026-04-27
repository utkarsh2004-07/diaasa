import { NextResponse } from "next/server";
import { getServerSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AUTH_COOKIE } from "@/lib/auth";

export async function POST() {
  try {
    const session = await getServerSession();
    if (session?.sessionId) {
      await prisma.session.deleteMany({ where: { id: session.sessionId } });
    }
    const res = NextResponse.json({ success: true, message: "Logged out" });
    res.cookies.delete(AUTH_COOKIE);
    return res;
  } catch {
    const res = NextResponse.json({ success: true, message: "Logged out" });
    res.cookies.delete(AUTH_COOKIE);
    return res;
  }
}
