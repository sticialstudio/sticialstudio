"use client"
import Link from 'next/link'
import React from 'react'

export default function NavBar() {
  return (
    <nav className="w-full bg-white dark:bg-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold">STEMAIDE</span>
        </div>
        <div className="flex gap-4 text-sm">
          <Link href="/courses">Courses</Link>
          <Link href="/projects">Projects</Link>
          <Link href="/editor">Editor</Link>
        </div>
      </div>
    </nav>
  )
}
