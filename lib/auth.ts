import { cookies } from "next/headers";
import { verifyToken, type JWTPayload } from "./jwt";
import { prisma } from "./prisma";

export const AUTH_COOKIE = "diaasa_auth";
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 30, // 30 days
};

export async function getServerSession(): Promise<JWTPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return await verifyToken(token);
}

export async function requireAuth() {
  const session = await getServerSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export async function requireAdmin() {
  const session = await getServerSession();
  if (!session) throw new Error("UNAUTHORIZED");
  if (!["ADMIN", "SUPER_ADMIN", "MANAGER"].includes(session.role))
    throw new Error("FORBIDDEN");
  return session;
}

export async function getAuthUser() {
  const session = await getServerSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      phone: true,
      email: true,
      name: true,
      avatar: true,
      role: true,
      isActive: true,
    },
  });

  if (!user || !user.isActive) return null;
  return user;
}

export function setAuthCookie(token: string) {
  return {
    name: AUTH_COOKIE,
    value: token,
    options: COOKIE_OPTIONS,
  };
}
