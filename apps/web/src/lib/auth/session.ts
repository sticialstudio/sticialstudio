export const TOKEN_COOKIE_NAME = 'token';

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, '');
}

function resolveApiBaseUrl() {
  const explicitBaseUrl = process.env.API_BASE_URL?.trim();
  if (explicitBaseUrl) {
    return normalizeBaseUrl(explicitBaseUrl);
  }

  const publicBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (publicBaseUrl) {
    return normalizeBaseUrl(publicBaseUrl);
  }

  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:4000';
  }

  throw new Error('Missing API_BASE_URL. Set API_BASE_URL or NEXT_PUBLIC_API_BASE_URL for the web deployment.');
}

export async function validateAppSessionToken(token: string) {
  const response = await fetch(`${resolveApiBaseUrl()}/api/auth/me`, {
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

export function getTokenCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  };
}
