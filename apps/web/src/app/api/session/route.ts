import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const rawSecret = process.env.JWT_SECRET || 'edtech-local-dev-jwt-secret';
const SECRET = new TextEncoder().encode(rawSecret);

function clearTokenCookie(response: NextResponse) {
  response.cookies.set('token', '', { path: '/', maxAge: 0, sameSite: 'lax' });
}

function getCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  };
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
    await jwtVerify(token, SECRET);
    const response = NextResponse.json({ success: true });
    response.cookies.set('token', token, getCookieOptions());
    return response;
  } catch {
    const response = NextResponse.json({ success: false, error: 'Session token is invalid or expired.' }, { status: 401 });
    clearTokenCookie(response);
    return response;
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  clearTokenCookie(response);
  return response;
}
