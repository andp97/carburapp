import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // API routes handle auth themselves and return 401 — never redirect them.
  // Redirecting a POST /api/* to /login causes a 307 that the service worker
  // can't forward, producing a 405.
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const hasSession = req.cookies.has('carburapp_session');
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (!isAuthPage && !hasSession) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|icon.*|apple-touch-icon.*|sw\\.js|manifest.*|og-image|opengraph-image|icon-.*\\.png|icon\\.svg).*)',
  ],
};
