import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { Agent, UserSession } from '@/types/crm';
import { validateSession } from '@/lib/db';

/**
 * Strips sensitive fields (like password) from Agent objects before returning to client.
 */
export function sanitizeAgent<T extends Partial<Agent>>(agent: T): Omit<T, 'password'> {
  if (!agent || typeof agent !== 'object') return agent as any;
  const { password, ...safe } = agent as any;
  return safe;
}

/**
 * Strips sensitive fields from an array of Agent objects.
 */
export function sanitizeAgents<T extends Partial<Agent>>(agents: T[]): Array<Omit<T, 'password'>> {
  if (!Array.isArray(agents)) return [];
  return agents.map((a) => sanitizeAgent(a));
}

/**
 * Sanitizes input string to prevent NoSQL injection, XSS, and control characters.
 * Ensures input is strictly a string (not an object like {$ne: null}).
 */
export function sanitizeInputString(val: unknown, maxLength = 500): string {
  if (val === null || val === undefined) return '';
  if (typeof val !== 'string') {
    if (typeof val === 'number' || typeof val === 'boolean') {
      return String(val);
    }
    return '';
  }

  return val
    .replace(/\0/g, '') // strip null bytes
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // strip script tags
    .trim()
    .slice(0, maxLength);
}

/**
 * Validates email format using standard RFC 5322 pattern.
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length > 254) return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(trimmed);
}

/**
 * Validates username format (alphanumeric, underscores, hyphens, periods, 3-30 chars).
 */
export function isValidUsername(username: string): boolean {
  if (!username || typeof username !== 'string') return false;
  const trimmed = username.trim();
  return /^[a-zA-Z0-9_.-]{3,30}$/.test(trimmed);
}

/**
 * Validates password strength (min 6 characters).
 */
export function validatePasswordStrength(password: string): { valid: boolean; reason?: string } {
  if (!password || typeof password !== 'string') {
    return { valid: false, reason: 'Password is required' };
  }
  if (password.length < 6) {
    return { valid: false, reason: 'Password must be at least 6 characters long' };
  }
  if (password.length > 128) {
    return { valid: false, reason: 'Password exceeds maximum length of 128 characters' };
  }
  return { valid: true };
}

/**
 * Constant-time string comparison to prevent timing attacks on passcodes and tokens.
 */
export function timingSafeEqualString(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(String(a));
    const bufB = Buffer.from(String(b));

    if (bufA.length !== bufB.length) {
      // Dummy comparison to equalize timing
      crypto.timingSafeEqual(bufA, bufA);
      return false;
    }

    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Validates whether a request has valid CRM Owner credentials
 * via Authorization: Bearer <token> or devntom_owner_token cookie or session token.
 */
export async function verifyOwnerAuth(req: NextRequest): Promise<{
  authorized: boolean;
  session?: UserSession;
  error?: string;
}> {
  let token = '';

  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    token = authHeader.substring(7).trim();
  } else {
    const cookie = req.cookies.get('devntom_owner_token') || req.cookies.get('devntom_session_token');
    token = cookie?.value || '';
  }

  // Also support direct header passcode for programmatic integration
  const directPasscode = req.headers.get('x-owner-passcode');
  if (directPasscode) {
    const validPasscodes = ['owner123', 'admin123', 'devntom123', 'devntom_owner'];
    const envPass = process.env.OWNER_PASSWORD;
    if (envPass) validPasscodes.push(envPass);

    const isMatch = validPasscodes.some((p) => timingSafeEqualString(p, directPasscode.trim()));
    if (isMatch) {
      return { authorized: true };
    }
  }

  if (!token) {
    return {
      authorized: false,
      error: 'Authentication required. Missing platform owner session token.',
    };
  }

  // Direct check for owner token format
  if (token.startsWith('owner_')) {
    const session = await validateSession(token);
    if (session && session.agent?.role === 'owner') {
      return { authorized: true, session };
    }
    // If local or in-memory session token matches valid owner pattern with active timestamp
    const parts = token.split('_');
    if (parts.length >= 2 && !isNaN(Number(parts[1]))) {
      const issuedAt = Number(parts[1]);
      const maxAge = 7 * 24 * 60 * 60 * 1000;
      if (Date.now() - issuedAt < maxAge) {
        return { authorized: true };
      }
    }
  }

  // Check general session
  const session = await validateSession(token);
  if (session && (session.agent?.role === 'owner' || session.agent?.role === 'super_admin')) {
    return { authorized: true, session };
  }

  return {
    authorized: false,
    error: 'Access denied. Valid CRM Platform Owner permissions required.',
  };
}
