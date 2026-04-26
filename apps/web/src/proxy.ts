import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { APP_SESSION_COOKIE, LEGACY_SESSION_COOKIE, validateAppSessionToken } from '@/lib/auth/session';

const publicPaths = ['/', '/login', '/register', '/auth/callback', '/api/auth/signup', '/api/auth/login'];

function readCookieToken(req: NextRequest) {
  const sessionToken = req.cookies.get(APP_SESSION_COOKIE)?.value;
  if (sessionToken) return sessionToken;

  const legacyToken = req.cookies.get(LEGACY_SESSION_COOKIE)?.value;
  if (legacyToken) return legacyToken;

  const rawCookie = req.headers.get('cookie');
  if (!rawCookie) return null;

  for (const part of rawCookie.split(';')) {
    const [name, ...valueParts] = part.trim().split('=');
    if (name === APP_SESSION_COOKIE || name === LEGACY_SESSION_COOKIE) {
      return valueParts.join('=');
    }
  }

  return null;
}

function clearAuthCookies(response: NextResponse) {
  response.cookies.set(APP_SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  response.cookies.set(LEGACY_SESSION_COOKIE, '', { path: '/', maxAge: 0 });
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProduction = process.env.NODE_ENV === 'production';
  const allowDevBypass = process.env.ENABLE_DEV_AUTH_BYPASS === 'true';

  if (publicPaths.includes(pathname)) return NextResponse.next();

  if (!isProduction && allowDevBypass) {
    return NextResponse.next();
  }

  const token = readCookieToken(req);

  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    await validateAppSessionToken(token);
    return NextResponse.next();
  } catch {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    const response = NextResponse.redirect(loginUrl);
    clearAuthCookies(response);
    return response;
  }
}

export const config = {
  matcher: ['/courses/:path*', '/projects/:path*', '/dashboard/:path*'],
};
