import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOTP } from "@/lib/otp";
import { signToken } from "@/lib/jwt";
import { rateLimitOTPVerify } from "@/lib/ratelimit";
import {
  successResponse,
  errorResponse,
  rateLimitResponse,
  serverErrorResponse,
  getClientIP,
} from "@/lib/response";
import { AUTH_COOKIE, COOKIE_OPTIONS } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/),
  otp: z.string().length(6),
  guestCartId: z.string().optional(),
  deviceInfo: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", parsed.error.errors[0].message);
    }

    const { phone, otp, guestCartId, deviceInfo } = parsed.data;
    const ip = getClientIP(request);
    const userAgent = request.headers.get("user-agent") || "";

    // Rate limit
    const limit = rateLimitOTPVerify(phone);
    if (!limit.allowed) return rateLimitResponse();

    // Find latest valid OTP
    const otpRecord = await prisma.otpRequest.findFirst({
      where: {
        phone,
        verifiedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otpRecord) {
      return errorResponse("OTP_EXPIRED", "OTP has expired. Please request a new one.");
    }

    // Increment attempt
    await prisma.otpRequest.update({
      where: { id: otpRecord.id },
      data: { attempts: { increment: 1 } },
    });

    if (otpRecord.attempts >= otpRecord.maxAttempts) {
      return errorResponse("OTP_MAX_ATTEMPTS", "Maximum OTP attempts exceeded. Please request a new one.");
    }

    // Verify OTP
    const valid = await verifyOTP(otp, otpRecord.otpHash);
    if (!valid) {
      const remaining = otpRecord.maxAttempts - otpRecord.attempts - 1;
      return errorResponse(
        "OTP_INVALID",
        `Invalid OTP. ${remaining} attempts remaining.`
      );
    }

    // Mark OTP as verified
    await prisma.otpRequest.update({
      where: { id: otpRecord.id },
      data: { verifiedAt: new Date() },
    });

    // Upsert user
    let user = await prisma.user.findUnique({ where: { phone } });
    const isNewUser = !user;

    if (!user) {
      user = await prisma.user.create({
        data: { phone, isVerified: true },
      });
    } else if (!user.isVerified) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      });
    }

    // Create session
    const sessionDays = Number(process.env.SESSION_DURATION_DAYS) || 30;
    const expiresAt = new Date(Date.now() + sessionDays * 24 * 60 * 60 * 1000);

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: crypto.randomUUID(),
        deviceInfo: deviceInfo || userAgent.slice(0, 255),
        ipAddress: ip,
        userAgent: userAgent.slice(0, 500),
        isTrusted: true,
        expiresAt,
      },
    });

    // Sign JWT
    const jwt = await signToken({
      userId: user.id,
      phone: user.phone,
      role: user.role,
      sessionId: session.id,
    });

    // Merge guest cart atomically
    if (guestCartId) {
      const guestItems = await prisma.cartItem.findMany({
        where: { guestId: guestCartId, userId: null },
        select: { id: true, variantId: true, productId: true, quantity: true },
      });
      for (const guestItem of guestItems) {
        await prisma.$transaction([
          prisma.cartItem.upsert({
            where: { userId_variantId: { userId: user.id, variantId: guestItem.variantId } },
            update: { quantity: { increment: guestItem.quantity } },
            create: { userId: user.id, productId: guestItem.productId, variantId: guestItem.variantId, quantity: guestItem.quantity },
          }),
          prisma.cartItem.delete({ where: { id: guestItem.id } }),
        ]);
      }
    }

    const response = successResponse(
      {
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
        },
        isNewUser,
      },
      isNewUser ? "Account created successfully!" : "Logged in successfully!"
    );

    // Set httpOnly cookie
    const res = NextResponse.json(
      { success: true, data: { user: { id: user.id, phone: user.phone, name: user.name, email: user.email, avatar: user.avatar, role: user.role }, isNewUser }, message: isNewUser ? "Account created successfully!" : "Logged in successfully!" },
      { status: 200 }
    );

    res.cookies.set(AUTH_COOKIE, jwt, COOKIE_OPTIONS);
    return res;
  } catch (error) {
    console.error("verify-otp error:", error);
    return serverErrorResponse();
  }
}
