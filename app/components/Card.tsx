"use client"
import React from 'react'

type Props = {
  title: string
  children?: React.ReactNode
}

export default function Card({ title, children }: Props) {
  return (
    <div className="p-4 border rounded-lg bg-white dark:bg-slate-800 shadow-sm">
      <h3 className="font-semibold mb-2">{title}</h3>
      <div>{children}</div>
    </div>
  )
}
