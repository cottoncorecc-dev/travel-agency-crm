import { NextResponse, type NextRequest } from 'next/server';
import { getClientIp, checkGeneralApiLimit, createRateLimitResponse, getRateLimitHeaders } from '@/lib/rateLimit';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const ip = getClientIp(request);

  // Apply general API rate limiting on /api/* routes (excluding health/status check)
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/db/status')) {
    const isMutation = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method);
    const limitResult = checkGeneralApiLimit(ip, isMutation);

    if (!limitResult.success) {
      return createRateLimitResponse(
        limitResult,
        `Rate limit exceeded on CRM API (${isMutation ? 'mutation' : 'query'}). Please slow down.`
      );
    }
  }

  const response = NextResponse.next();

  // Standard Security Headers (safe for iFrame embedding in AI Studio preview)
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
