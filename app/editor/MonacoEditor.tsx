"use client"
import dynamic from 'next/dynamic'
import React from 'react'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

type Props = {
  value: string
  onChange?: (v: string) => void
}

export default function MonacoEditorWrapper({ value, onChange }: Props) {
  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MonacoEditor
        height="100%"
        defaultLanguage="cpp"
        defaultValue={value}
        onChange={(v) => onChange?.(typeof v === 'string' ? v : '')}
        theme="vs-dark"
        options={{ minimap: { enabled: false }, fontSize: 14 }}
      />
    </div>
  )
}
