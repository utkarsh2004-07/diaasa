import { prisma } from "./prisma";

interface RateLimitConfig {
  key: string;
  limit: number;
  windowMs: number; // milliseconds
}

export async function checkRateLimit(config: RateLimitConfig): Promise<{
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + config.windowMs);

  try {
    const existing = await prisma.rateLimit.findUnique({
      where: { key: config.key },
    });

    if (!existing || existing.resetAt < now) {
      // Create or reset
      await prisma.rateLimit.upsert({
        where: { key: config.key },
        update: { count: 1, resetAt },
        create: { key: config.key, count: 1, resetAt },
      });
      return { allowed: true, remaining: config.limit - 1, resetAt };
    }

    if (existing.count >= config.limit) {
      return { allowed: false, remaining: 0, resetAt: existing.resetAt };
    }

    await prisma.rateLimit.update({
      where: { key: config.key },
      data: { count: { increment: 1 } },
    });

    return {
      allowed: true,
      remaining: config.limit - existing.count - 1,
      resetAt: existing.resetAt,
    };
  } catch {
    // On DB error, allow through (fail open)
    return { allowed: true, remaining: 1, resetAt };
  }
}

// Convenience wrappers
export async function rateLimitOTPSend(phone: string) {
  return checkRateLimit({
    key: `otp:send:${phone}`,
    limit: 5,
    windowMs: 60 * 60 * 1000, // 5 per hour
  });
}

export async function rateLimitOTPVerify(phone: string) {
  return checkRateLimit({
    key: `otp:verify:${phone}`,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
}

export async function rateLimitCoupon(userId: string) {
  return checkRateLimit({
    key: `coupon:${userId}`,
    limit: 10,
    windowMs: 60 * 60 * 1000,
  });
}

export async function rateLimitReview(userId: string) {
  return checkRateLimit({
    key: `review:${userId}`,
    limit: 5,
    windowMs: 24 * 60 * 60 * 1000,
  });
}

export async function rateLimitByIP(ip: string, action: string, limit = 20) {
  return checkRateLimit({
    key: `${action}:ip:${ip}`,
    limit,
    windowMs: 60 * 60 * 1000,
  });
}
