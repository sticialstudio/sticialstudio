"use client"
import React from 'react'
import NavBar from './NavBar'

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
      <NavBar />
      <main className="pt-4">{children}</main>
    </div>
  )
}
