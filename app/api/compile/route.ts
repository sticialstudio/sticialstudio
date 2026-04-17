import { NextResponse } from 'next/server';

const COMPILER_API_URL = process.env.COMPILER_API_URL ?? 'http://localhost:4000';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sourceCode: string = body?.sourceCode ?? body?.code ?? '';
    const board: string = body?.board ?? 'Arduino Uno';

    if (!sourceCode.trim()) {
      return NextResponse.json(
        { success: false, log: 'No source code provided.' },
        { status: 400 }
      );
    }

    // Proxy to the external compile service.
    let upstream: Response;
    try {
      upstream = await fetch(`${COMPILER_API_URL}/api/compile/arduino`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceCode, board }),
        signal: AbortSignal.timeout(30_000),
      });
    } catch (networkError) {
      const msg =
        networkError instanceof Error ? networkError.message : String(networkError);
      console.error('[compile/route] Upstream compiler unreachable:', msg);
      return NextResponse.json(
        {
          success: false,
          log: `Compiler service is not reachable. Start the backend server or set COMPILER_API_URL.\n\nDetail: ${msg}`,
        },
        { status: 503 }
      );
    }

    const data = await upstream.json().catch(() => null);

    if (!upstream.ok || !data?.success) {
      return NextResponse.json(
        {
          success: false,
          log: data?.log ?? data?.error ?? `Compilation failed (upstream ${upstream.status}).`,
        },
        { status: upstream.status >= 500 ? 502 : upstream.status }
      );
    }

    if (typeof data.hex !== 'string' || !data.hex.trim()) {
      return NextResponse.json(
        { success: false, log: 'Compiler returned no HEX payload.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, hex: data.hex, log: data.log ?? '' });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unexpected server error.';
    console.error('[compile/route] Unhandled error:', msg);
    return NextResponse.json({ success: false, log: msg }, { status: 500 });
  }
}
