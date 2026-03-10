import { NextResponse } from 'next/server'
import { hashPassword, signToken } from '../../../lib/auth'
import prisma from '../../../../lib/prisma'

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json()
    if (!email || !password) {
      return NextResponse.json({ success: false, error: 'Missing credentials' }, { status: 400 })
    }
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ success: false, error: 'User already exists' }, { status: 400 })
    }
    const hashed = await hashPassword(password)
    const user = await prisma.user.create({ data: { email, name, password: hashed } })
    // create minimal payload
    const token = signToken({ userId: user.id, email: user.email })
    const res = NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } })
    // set HttpOnly cookie
    res.cookies.set('token', token, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7 })
    return res
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Signup failed' }, { status: 500 })
  }
}
