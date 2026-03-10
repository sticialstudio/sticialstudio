"use client"
import React, { useEffect, useRef } from 'react'

type Props = {
  onCodeGenerated?: (code: string) => void
}

declare const Blockly: any
export default function BlockEditor({ onCodeGenerated }: Props) {
  const blocklyDivRef = useRef<HTMLDivElement | null>(null)
  const workspaceRef = useRef<any>(null)

  useEffect(() => {
    // Dynamically load Blockly script from CDN
    const script = document.createElement('script')
    script.src = 'https://unpkg.com/blockly/blockly.min.js'
    script.async = true
    script.onload = () => {
      // @ts-ignore - Blockly is loaded from CDN at runtime
      const hasBlockly = typeof (window as any).Blockly !== 'undefined'
      if (blocklyDivRef.current && hasBlockly) {
        // @ts-ignore
        const workspace = (window as any).Blockly.inject(blocklyDivRef.current, {
          toolbox: toolboxXml(),
        })
        workspaceRef.current = workspace
        // Generate code on changes (simplified)
        workspace.addChangeListener(() => {
          // @ts-ignore - rely on Arduino-like code generation if available
          const code = (window as any).Blockly?.Arduino?.workspaceToCode?.(workspace) ?? ''
          if (typeof onCodeGenerated === 'function') onCodeGenerated(code)
        })
      }
    }
    document.body.appendChild(script)
    return () => {
      if (workspaceRef.current) {
        workspaceRef.current.dispose()
      }
      document.body.removeChild(script)
    }
  }, [])

  function toolboxXml() {
    // Minimal toolbox with blocks for Arduino; it's a simplified static XML
    const xml = `
      <xml id="toolbox" style="display: none">
        <block type="digitalWrite"></block>
        <block type="digitalRead"></block>
        <block type="analogRead"></block>
        <block type="analogWrite"></block>
        <block type="delay"></block>
        <block type="pinMode"></block>
        <block type="serialPrint"></block>
      </xml>`
    return xml
  }

  return (
    <div className="w-full h-full">
      <div ref={blocklyDivRef} style={{ height: '100%', width: '100%' }} />
    </div>
  )
}
