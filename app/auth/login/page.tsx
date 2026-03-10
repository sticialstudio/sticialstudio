"use client"
import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    })
    const data = await res.json()
    if (res.ok && data.success) {
      router.push('/courses')
    } else {
      setError(data.error ?? 'Login failed')
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-white dark:bg-slate-800 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">Login</h2>
      <form onSubmit={onSubmit} className="space-y-3">
        <input className="w-full p-2 border rounded" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="w-full p-2 border rounded" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        <button className="w-full py-2 bg-brand-500 text-white rounded" type="submit">Login</button>
      </form>
    </div>
  )
}
