import { NextRequest, NextResponse } from 'next/server';
import { buildUpstreamApiUrl } from '@/lib/api/upstream';

export const runtime = 'nodejs';

function buildProxyHeaders(request: NextRequest) {
  const headers = new Headers(request.headers);

  headers.delete('connection');
  headers.delete('content-length');
  headers.delete('host');
  headers.delete('origin');
  headers.delete('referer');

  return headers;
}

async function readProxyBody(request: NextRequest) {
  if (request.method === 'GET' || request.method === 'HEAD') {
    return undefined;
  }

  const body = await request.arrayBuffer();
  return body.byteLength > 0 ? body : undefined;
}

async function proxyRequest(request: NextRequest) {
  try {
    const upstreamUrl = buildUpstreamApiUrl(`${request.nextUrl.pathname}${request.nextUrl.search}`);

    if (new URL(upstreamUrl).origin === request.nextUrl.origin) {
      throw new Error('API_BASE_URL points to this web app. Set it to the external API service URL.');
    }

    const upstreamResponse = await fetch(upstreamUrl, {
      method: request.method,
      headers: buildProxyHeaders(request),
      body: await readProxyBody(request),
      redirect: 'manual',
    });

    const responseHeaders = new Headers(upstreamResponse.headers);
    responseHeaders.delete('connection');
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('transfer-encoding');

    return new NextResponse(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Could not reach the upstream API service.';

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 502 },
    );
  }
}

export async function GET(request: NextRequest) {
  return proxyRequest(request);
}

export async function POST(request: NextRequest) {
  return proxyRequest(request);
}

export async function PUT(request: NextRequest) {
  return proxyRequest(request);
}

export async function PATCH(request: NextRequest) {
  return proxyRequest(request);
}

export async function DELETE(request: NextRequest) {
  return proxyRequest(request);
}

export async function OPTIONS(request: NextRequest) {
  return proxyRequest(request);
}