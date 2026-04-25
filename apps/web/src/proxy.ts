import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { TOKEN_COOKIE_NAME, validateAppSessionToken } from '@/lib/auth/session';

const isProduction = process.env.NODE_ENV === 'production';
const allowDevBypass = process.env.ENABLE_DEV_AUTH_BYPASS === 'true';

const publicPaths = ['/', '/login', '/register', '/auth/callback', '/api/auth/signup', '/api/auth/login'];

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (publicPaths.includes(pathname)) return NextResponse.next();

  const token = req.cookies.get(TOKEN_COOKIE_NAME)?.value;

  if (!isProduction && allowDevBypass && token === 'dev-token-bypass') {
    return NextResponse.next();
  }

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
    const res = NextResponse.redirect(loginUrl);
    res.cookies.set(TOKEN_COOKIE_NAME, '', { path: '/', maxAge: 0, sameSite: 'lax' });
    return res;
  }
}

export const config = {
  matcher: ['/courses/:path*', '/projects/:path*', '/dashboard/:path*'],
};
