import { NextRequest, NextResponse } from 'next/server';
import { TOKEN_COOKIE_NAME, getTokenCookieOptions, validateAppSessionToken } from '@/lib/auth/session';

function clearTokenCookie(response: NextResponse) {
  response.cookies.set(TOKEN_COOKIE_NAME, '', { path: '/', maxAge: 0, sameSite: 'lax' });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const token = typeof body?.token === 'string' ? body.token.trim() : '';

  if (!token) {
    const response = NextResponse.json({ success: false, error: 'Session token is required.' }, { status: 400 });
    clearTokenCookie(response);
    return response;
  }

  try {
    await validateAppSessionToken(token);
    const response = NextResponse.json({ success: true });
    response.cookies.set(TOKEN_COOKIE_NAME, token, getTokenCookieOptions());
    return response;
  } catch (error) {
    const message = error instanceof Error && error.message
      ? error.message
      : 'Session token is invalid or expired.';
    const response = NextResponse.json({ success: false, error: message }, { status: 401 });
    clearTokenCookie(response);
    return response;
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  clearTokenCookie(response);
  return response;
}
