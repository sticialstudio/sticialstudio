# BoardContext Architecture

## Overview
The \`BoardContext\` is the centralized state coordinator for hardware targeting within the EdTech IDE. It derives all dependent languages, templates, and compilation variables directly from the core \`BOARD_CONFIG\`, eliminating duplicate states across the UI.

## File Structure
- **Provider**: \`apps/web/src/contexts/BoardContext.tsx\`
- **Configuration Dictionary**: \`apps/web/src/lib/boards/boardConfig.ts\`

## Context Values
\`\`\`typescript
interface BoardContextValue {
    currentBoard: BoardKey;           // i.e 'Arduino Uno' | 'ESP32'
    setCurrentBoard: Function;        // Exposed handler to adjust the board
    language: string;                 // Mapped directly to monaco (cpp | python)
    generator: string;                // Mapped to Blockly generator logic (arduino | micropython)
    compileStrategy: string;          // Action strategy for the execution pipeline
}
\`\`\`

## Component Consumption
Consume the context via the \`useBoard()\` hook:
\`\`\`typescript
import { useBoard } from '@/contexts/BoardContext';

export default function MyComponent() {
    const { currentBoard, language, generator } = useBoard();
    
    return <div>Targetting: {currentBoard} ({language})</div>;
}
\`\`\`

## React Lifecycle Integration (Blockly)
Because Blockly operates imperatively outside standard React reconciliation cycles, switching a \`generatorType\` arbitrarily leaves residual XML blocks mapped to the previous target on the workspace (e.g., throwing a Python pin-mapping into Arduino generator).

**Resolution Model: Remount**
Instead of attempting dirty diff cleanups via the Blockly UI engine, \`BlockEditor.tsx\` inherently intercepts \`useBoard()\`, hooking into \`currentBoard\` strictly to increment a local \`boardKey\` state. This effectively throws away the entire component's root \`div\` container forcing the original \`useEffect\` logic to dump the old injected \`workspaceRef.current\` and re-render standard default setups dynamically against the new target language.
