import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/register'];
const PUBLIC_API_PREFIX = '/api/auth/';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublic =
    PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/')) ||
    pathname.startsWith(PUBLIC_API_PREFIX);

  const hasSession = req.cookies.has('carburapp_session');

  if (!isPublic && !hasSession) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  if ((pathname === '/login' || pathname === '/register') && hasSession) {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|icon.*|apple-touch-icon.*|sw\\.js|manifest.*|og-image|opengraph-image|icon-.*\\.png|icon\\.svg).*)',
  ],
};
