import { jwtVerify } from 'jose';

export const APP_SESSION_COOKIE = 'sticial_session';
export const LEGACY_SESSION_COOKIE = 'token';

const DEV_FALLBACK_SECRET = 'edtech-local-dev-jwt-secret';

export function getAppSessionSecret() {
  const envSecret = process.env.JWT_SECRET;
  const isProduction = process.env.NODE_ENV === 'production';

  if (!envSecret && isProduction) {
    throw new Error('Missing required environment variable: JWT_SECRET');
  }

  return new TextEncoder().encode(envSecret || DEV_FALLBACK_SECRET);
}

export async function verifyAppSessionToken(token: string) {
  return jwtVerify(token, getAppSessionSecret());
}

export function getAppSessionCookieOptions() {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  };
}
