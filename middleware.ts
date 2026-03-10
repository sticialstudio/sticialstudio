import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET;
const isProduction = process.env.NODE_ENV === 'production';
const DEV_FALLBACK_SECRET = 'edtech-local-dev-jwt-secret';

if (!secret && isProduction) {
  throw new Error('Missing required environment variable: JWT_SECRET');
}

if (!secret && !isProduction) {
  console.warn('[auth] JWT_SECRET is not set. Using local development fallback secret.');
}

const SECRET = secret || DEV_FALLBACK_SECRET;

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const publicPaths = ['/', '/auth/login', '/auth/signup', '/api/auth/signup', '/api/auth/login'];
  if (publicPaths.includes(pathname)) return NextResponse.next();

  const token = req.cookies.get('token')?.value;
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', req.url));
  }
  try {
    jwt.verify(token, SECRET);
    return NextResponse.next();
  } catch {
    const res = NextResponse.redirect(new URL('/auth/login', req.url));
    res.cookies.set('token', '', { path: '/', maxAge: 0 });
    return res;
  }
}

export const config = {
  matcher: ['/courses/:path*', '/projects/:path*', '/editor/:path*'],
};
