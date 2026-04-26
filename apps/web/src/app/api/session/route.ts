import { NextRequest, NextResponse } from 'next/server';
import {
  APP_SESSION_COOKIE,
  LEGACY_SESSION_COOKIE,
  getAppSessionCookieOptions,
  validateAppSessionToken,
} from '@/lib/auth/session';
import { normalizeRuntimeError } from '@/lib/runtime/normalizeRuntimeError';

function clearCookies(response: NextResponse) {
  response.cookies.set(APP_SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  response.cookies.set(LEGACY_SESSION_COOKIE, '', { path: '/', maxAge: 0 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const token = typeof body?.token === 'string' ? body.token.trim() : '';

    if (!token) {
      return NextResponse.json({ success: false, error: 'Session token is required.' }, { status: 400 });
    }

    await validateAppSessionToken(token);

    const response = NextResponse.json({ success: true });
    response.cookies.set(APP_SESSION_COOKIE, token, getAppSessionCookieOptions());
    response.cookies.set(LEGACY_SESSION_COOKIE, '', { path: '/', maxAge: 0 });
    return response;
  } catch (error) {
    const normalized = normalizeRuntimeError(error, 'Could not establish the app session cookie.');
    const response = NextResponse.json(
      {
        success: false,
        error: normalized.message,
        details: {
          name: normalized.name,
          eventType: normalized.eventType,
          targetUrl: normalized.targetUrl,
        },
      },
      { status: 401 },
    );
    clearCookies(response);
    return response;
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  clearCookies(response);
  return response;
}
