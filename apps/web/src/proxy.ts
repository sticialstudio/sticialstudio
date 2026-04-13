import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const rawSecret = process.env.JWT_SECRET || 'edtech-local-dev-jwt-secret';
const SECRET = new TextEncoder().encode(rawSecret);
const isProduction = process.env.NODE_ENV === 'production';
const allowDevBypass = process.env.ENABLE_DEV_AUTH_BYPASS === 'true';

const publicPaths = ['/', '/login', '/register', '/api/auth/signup', '/api/auth/login'];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (publicPaths.includes(pathname)) return NextResponse.next();

  const token = req.cookies.get('token')?.value;

  if (!isProduction && allowDevBypass && token === 'dev-token-bypass') {
    return NextResponse.next();
  }

  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    await jwtVerify(token, SECRET);
    return NextResponse.next();
  } catch {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('from', pathname);
    const res = NextResponse.redirect(loginUrl);
    res.cookies.set('token', '', { path: '/', maxAge: 0 });
    return res;
  }
}

export const config = {
  matcher: ['/courses/:path*', '/projects/:path*', '/dashboard/:path*'],
};
