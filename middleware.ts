import { NextRequest, NextResponse } from 'next/server';
import { unsealData } from 'iron-session';
import type { SessionData } from '@/lib/session';

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const cookieValue = request.cookies.get('carburapp_session')?.value;
  if (!cookieValue) return false;
  try {
    const data = await unsealData<SessionData>(cookieValue, {
      password: process.env.SESSION_SECRET!,
    });
    return !!data.user;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === '/app' || pathname.startsWith('/app/')) {
    if (!(await isAuthenticated(request))) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (pathname === '/') {
    if (await isAuthenticated(request)) {
      return NextResponse.redirect(new URL('/app', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/app', '/app/:path*'],
};
