import { buildUpstreamApiUrl } from '@/lib/api/upstream';

export const APP_SESSION_COOKIE = 'sticial_session';
export const LEGACY_SESSION_COOKIE = 'token';

export async function validateAppSessionToken(token: string) {
  const response = await fetch(buildUpstreamApiUrl('/api/auth/me'), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || 'Session token is invalid or expired.');
  }

  return response.json().catch(() => null);
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
