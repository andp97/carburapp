import { NextRequest, NextResponse } from 'next/server';
import { unsealData } from 'iron-session';
import { SESSION_OPTIONS } from '@/lib/session';
import type { SessionData } from '@/lib/session';

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const cookieValue = request.cookies.get(SESSION_OPTIONS.cookieName)?.value;
  if (!cookieValue) return false;
  try {
    const data = await unsealData<SessionData>(cookieValue, {
      password: process.env.SESSION_SECRET!,
      ttl: (SESSION_OPTIONS.cookieOptions?.maxAge ?? 14 * 24 * 3600) as number,
    });
    return !!data.user;
  } catch {
    return false;
  }
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // API routes handle auth themselves and return 401 — never redirect them.
  // Redirecting a POST /api/* to /login causes a 307 that the service worker
  // can't forward, producing a 405.
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const authed = await isAuthenticated(req);

  // Protected: /app and any sub-paths
  if (pathname === '/app' || pathname.startsWith('/app/')) {
    if (!authed) return NextResponse.redirect(new URL('/login', req.url));
  }

  // Public routes — redirect authenticated users straight to the app
  if (pathname === '/' || pathname === '/login' || pathname === '/register') {
    if (authed) return NextResponse.redirect(new URL('/app', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|icon.*|apple-touch-icon.*|sw\\.js|manifest.*|og-image|opengraph-image|icon-.*\\.png|icon\\.svg).*)',
  ],
};
