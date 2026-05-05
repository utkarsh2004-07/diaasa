// In-memory rate limiter — zero DB hits, resets on server restart (fine for single-process KVM)
interface Entry { count: number; resetAt: number; }
const store = new Map<string, Entry>();

// Cleanup expired entries every 5 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}, 5 * 60 * 1000);

interface RateLimitConfig { key: string; limit: number; windowMs: number; }
interface RateLimitResult { allowed: boolean; remaining: number; resetAt: Date; }

export function checkRateLimit(config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const existing = store.get(config.key);

  if (!existing || existing.resetAt < now) {
    const resetAt = now + config.windowMs;
    store.set(config.key, { count: 1, resetAt });
    return { allowed: true, remaining: config.limit - 1, resetAt: new Date(resetAt) };
  }

  if (existing.count >= config.limit) {
    return { allowed: false, remaining: 0, resetAt: new Date(existing.resetAt) };
  }

  existing.count++;
  return { allowed: true, remaining: config.limit - existing.count, resetAt: new Date(existing.resetAt) };
}

export function rateLimitOTPSend(phone: string) {
  return checkRateLimit({ key: `otp:send:${phone}`, limit: 5, windowMs: 60 * 60 * 1000 });
}

export function rateLimitOTPVerify(phone: string) {
  return checkRateLimit({ key: `otp:verify:${phone}`, limit: 10, windowMs: 60 * 60 * 1000 });
}

export function rateLimitCoupon(userId: string) {
  return checkRateLimit({ key: `coupon:${userId}`, limit: 10, windowMs: 60 * 60 * 1000 });
}

export function rateLimitReview(userId: string) {
  return checkRateLimit({ key: `review:${userId}`, limit: 5, windowMs: 24 * 60 * 60 * 1000 });
}

export function rateLimitByIP(ip: string, action: string, limit = 20) {
  return checkRateLimit({ key: `${action}:ip:${ip}`, limit, windowMs: 60 * 60 * 1000 });
}
