import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const code = body?.code || ''
    // Very lightweight stub: pretend compilation succeeded if non-empty
    if (!code.trim()) {
      return NextResponse.json({ success: false, error: 'No code provided' }, { status: 400 })
    }
    // In a real system, you would invoke a containerized Arduino toolchain here
    return NextResponse.json({ success: true, output: 'Compilation succeeded (simulated).' })
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Invalid request' }, { status: 400 })
  }
}
