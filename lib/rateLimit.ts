import { NextRequest, NextResponse } from 'next/server';

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp in seconds
  retryAfterSeconds?: number;
}

interface RateLimitStoreRecord {
  count: number;
  firstRequest: number; // ms
  resetTime: number; // ms
  blockedUntil?: number; // ms
}

// In-memory sliding window cache
const rateLimitMap = new Map<string, RateLimitStoreRecord>();

// Clean up stale entries periodically (every 60s)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      if (now > record.resetTime && (!record.blockedUntil || now > record.blockedUntil)) {
        rateLimitMap.delete(key);
      }
    }
  }, 60_000);
}

/**
 * Extracts client IP from request headers safely with fallback.
 */
export function getClientIp(req: Request | NextRequest): string {
  try {
    const xff = req.headers.get('x-forwarded-for');
    if (xff) {
      const parts = xff.split(',');
      const first = parts[0]?.trim();
      if (first && /^[\da-fA-F.:]{3,45}$/.test(first)) {
        return first;
      }
    }

    const realIp = req.headers.get('x-real-ip');
    if (realIp && /^[\da-fA-F.:]{3,45}$/.test(realIp.trim())) {
      return realIp.trim();
    }

    const cfIp = req.headers.get('cf-connecting-ip');
    if (cfIp && /^[\da-fA-F.:]{3,45}$/.test(cfIp.trim())) {
      return cfIp.trim();
    }
  } catch {
    // fallback
  }

  return '127.0.0.1';
}

/**
 * Core rate limit checker
 * @param key Unique key for the rate limit target (e.g. `login:1.2.3.4:john`)
 * @param maxRequests Maximum allowed requests in the window
 * @param windowSeconds Window length in seconds
 * @param blockDurationSeconds Lockout duration if limit exceeded
 */
export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowSeconds: number,
  blockDurationSeconds?: number
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const blockMs = (blockDurationSeconds || windowSeconds) * 1000;

  let record = rateLimitMap.get(key);

  // If currently locked out
  if (record?.blockedUntil && now < record.blockedUntil) {
    const retryAfter = Math.ceil((record.blockedUntil - now) / 1000);
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      reset: Math.ceil(record.blockedUntil / 1000),
      retryAfterSeconds: Math.max(1, retryAfter),
    };
  }

  // If expired or doesn't exist, create a new record
  if (!record || now >= record.resetTime) {
    record = {
      count: 1,
      firstRequest: now,
      resetTime: now + windowMs,
    };
    rateLimitMap.set(key, record);
    return {
      success: true,
      limit: maxRequests,
      remaining: Math.max(0, maxRequests - 1),
      reset: Math.ceil(record.resetTime / 1000),
    };
  }

  // Increment count
  record.count += 1;

  if (record.count > maxRequests) {
    record.blockedUntil = now + blockMs;
    const retryAfter = Math.ceil(blockMs / 1000);
    return {
      success: false,
      limit: maxRequests,
      remaining: 0,
      reset: Math.ceil((now + blockMs) / 1000),
      retryAfterSeconds: Math.max(1, retryAfter),
    };
  }

  return {
    success: true,
    limit: maxRequests,
    remaining: Math.max(0, maxRequests - record.count),
    reset: Math.ceil(record.resetTime / 1000),
  };
}

/**
 * Resets rate limit for a key (e.g., upon successful authentication)
 */
export function resetRateLimit(key: string): void {
  rateLimitMap.delete(key);
}

/**
 * Returns standard rate limit headers object
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.reset),
  };

  if (!result.success && result.retryAfterSeconds) {
    headers['Retry-After'] = String(result.retryAfterSeconds);
  }

  return headers;
}

/**
 * Creates standard 429 Too Many Requests response
 */
export function createRateLimitResponse(
  result: RateLimitResult,
  customMessage?: string
): NextResponse {
  const retrySec = result.retryAfterSeconds || 60;
  const message =
    customMessage ||
    `Too many requests. Please wait ${retrySec > 60 ? Math.ceil(retrySec / 60) + ' minutes' : retrySec + ' seconds'} before trying again.`;

  return NextResponse.json(
    {
      error: message,
      rateLimited: true,
      retryAfterSeconds: retrySec,
      resetAt: new Date(result.reset * 1000).toISOString(),
    },
    {
      status: 429,
      headers: getRateLimitHeaders(result),
    }
  );
}

// -------------------------------------------------------------
// PRESETS FOR KEY ENDPOINTS
// -------------------------------------------------------------

/**
 * Login Rate Limiter:
 * Allows 5 failed login attempts per 5 minutes per user/IP.
 * Exceeding blocks for 10 minutes.
 */
export function checkLoginLimit(ip: string, username?: string): RateLimitResult {
  const normUser = (username || '').trim().toLowerCase();
  const key = normUser ? `login:${ip}:${normUser}` : `login_ip:${ip}`;
  return checkRateLimit(key, 5, 300, 600);
}

export function clearLoginLimit(ip: string, username?: string): void {
  const normUser = (username || '').trim().toLowerCase();
  if (normUser) resetRateLimit(`login:${ip}:${normUser}`);
  resetRateLimit(`login_ip:${ip}`);
}

/**
 * CRM Owner Login Rate Limiter:
 * 5 attempts per 10 minutes per IP. Exceeding blocks for 15 minutes.
 */
export function checkOwnerLoginLimit(ip: string): RateLimitResult {
  return checkRateLimit(`owner_login:${ip}`, 5, 600, 900);
}

export function clearOwnerLoginLimit(ip: string): void {
  resetRateLimit(`owner_login:${ip}`);
}

/**
 * OTP Request Limiter:
 * Maximum 3 OTP send requests per 10 minutes per identifier/IP.
 */
export function checkOtpSendLimit(ip: string, identifier?: string): RateLimitResult {
  const norm = (identifier || '').trim().toLowerCase();
  const key = norm ? `otp_send:${ip}:${norm}` : `otp_send_ip:${ip}`;
  return checkRateLimit(key, 3, 600, 600);
}

/**
 * OTP Verification Limiter:
 * Maximum 5 incorrect OTP attempts per 15 minutes to prevent brute forcing 6-digit codes.
 */
export function checkOtpVerifyLimit(ip: string, identifier?: string): RateLimitResult {
  const norm = (identifier || '').trim().toLowerCase();
  const key = norm ? `otp_verify:${ip}:${norm}` : `otp_verify_ip:${ip}`;
  return checkRateLimit(key, 5, 900, 900);
}

export function clearOtpVerifyLimit(ip: string, identifier?: string): void {
  const norm = (identifier || '').trim().toLowerCase();
  if (norm) resetRateLimit(`otp_verify:${ip}:${norm}`);
  resetRateLimit(`otp_verify_ip:${ip}`);
}

/**
 * Company Registration / Signup Limiter:
 * Maximum 5 new company registrations per 30 minutes per IP.
 */
export function checkSignupLimit(ip: string): RateLimitResult {
  return checkRateLimit(`signup:${ip}`, 5, 1800, 1800);
}

/**
 * General API Limiter:
 * 60 mutations/min, 180 queries/min per IP.
 */
export function checkGeneralApiLimit(ip: string, isMutation = false): RateLimitResult {
  const max = isMutation ? 60 : 180;
  const key = `api_${isMutation ? 'write' : 'read'}:${ip}`;
  return checkRateLimit(key, max, 60);
}
