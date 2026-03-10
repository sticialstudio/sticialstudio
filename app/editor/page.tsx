import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
const BlockEditor = dynamic(() => import('../blockly/BlockEditor'), { ssr: false })
import MonacoEditorWrapper from './MonacoEditor'

export default function EditorPage() {
  const [code, setCode] = useState('// Arduino sketch goes here\nvoid setup() {\n  Serial.begin(9600);\n}\nvoid loop() {\n  // your code\n}\n')
  useEffect(() => {
    // Generate initial content for Monaco editor from a simple template
  }, [])
  return (
    <section className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold">Code Editor</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 h-96">
          <h4 className="font-semibold mb-2">Block Coding (Blockly)</h4>
          <div className="h-72 border rounded overflow-hidden">
            <BlockEditor />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow p-4 h-96 flex flex-col">
          <h4 className="font-semibold mb-2">Text Coding (Monaco)</h4>
          <div className="flex-1 overflow-hidden">
            <MonacoEditorWrapper value={code} onChange={setCode} />
          </div>
        </div>
      </div>
    </section>
  )
}
