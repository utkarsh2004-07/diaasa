import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOTP, hashOTP, getOTPExpiry } from "@/lib/otp";
import { sendOTPViaSMS } from "@/lib/fast2sms";
import { rateLimitOTPSend, rateLimitByIP } from "@/lib/ratelimit";
import {
  successResponse,
  errorResponse,
  rateLimitResponse,
  serverErrorResponse,
  getClientIP,
} from "@/lib/response";
import { z } from "zod";

const schema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid Indian mobile number"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", parsed.error.errors[0].message);
    }

    const { phone } = parsed.data;
    const ip = getClientIP(request);

    // Rate limit by IP
    const ipLimit = await rateLimitByIP(ip, "otp-send", 10);
    if (!ipLimit.allowed) return rateLimitResponse();

    // Rate limit by phone
    const phoneLimit = await rateLimitOTPSend(phone);
    if (!phoneLimit.allowed) {
      return errorResponse(
        "RATE_LIMIT_EXCEEDED",
        "Too many OTP requests. Please wait before trying again.",
        429
      );
    }

    // Check resend cooldown (30 sec)
    const recent = await prisma.otpRequest.findFirst({
      where: {
        phone,
        createdAt: { gte: new Date(Date.now() - 30_000) },
      },
      orderBy: { createdAt: "desc" },
    });

    if (recent) {
      const wait = Math.ceil(
        (30_000 - (Date.now() - recent.createdAt.getTime())) / 1000
      );
      return errorResponse(
        "RESEND_COOLDOWN",
        `Please wait ${wait} seconds before requesting another OTP.`,
        429
      );
    }

    const otp = generateOTP(6);
    const otpHash = await hashOTP(otp);
    const expiresAt = getOTPExpiry(Number(process.env.OTP_EXPIRY_MINUTES) || 5);

    // Invalidate old OTPs
    await prisma.otpRequest.updateMany({
      where: { phone, verifiedAt: null, expiresAt: { gt: new Date() } },
      data: { expiresAt: new Date() },
    });

    // Save new OTP
    await prisma.otpRequest.create({
      data: { phone, otpHash, expiresAt, ipAddress: ip },
    });

    // Send SMS
    const sent = await sendOTPViaSMS(phone, otp);
    if (!sent) {
      return errorResponse("SMS_FAILED", "Failed to send OTP. Please try again.");
    }

    return successResponse(
      { phone, expiresIn: 300, resendIn: 30 },
      "OTP sent successfully"
    );
  } catch (error) {
    console.error("send-otp error:", error);
    return serverErrorResponse();
  }
}
