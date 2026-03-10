import { NextResponse } from 'next/server'
import { verifyToken, hashPassword, comparePassword, signToken } from '../../../lib/auth'
import prisma from '../../../../lib/prisma'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Missing credentials' }, { status: 400 })
    }
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }
    const ok = await comparePassword(password, user.password)
    if (!ok) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }
    const token = signToken({ userId: user.id, email: user.email })
    const res = NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } })
    res.cookies.set('token', token, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7 })
    return res
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Login failed' }, { status: 500 })
  }
}
