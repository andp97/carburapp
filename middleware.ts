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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = await isAuthenticated(request);

  if ((pathname === '/app' || pathname.startsWith('/app/')) && !authed) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname === '/' && authed) {
    return NextResponse.redirect(new URL('/app', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/app', '/app/:path*'],
};
