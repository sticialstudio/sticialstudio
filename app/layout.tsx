import React from 'react'

import '../styles/globals.css'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head />
      <body className="min-h-screen bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">
        {children}
      </body>
    </html>
  )
}
