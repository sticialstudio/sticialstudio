export function generateArduinoTemplate(globalCode: string, setupCode: string, loopCode: string) {
    const normalizedSetupCode = setupCode.trim().length > 0 ? setupCode : '  // Setup logic';
    const normalizedLoopCode = loopCode.trim().length > 0 ? loopCode : '  // Loop logic';
    const normalizedGlobalCode = globalCode.trim();

    return `${normalizedGlobalCode ? `${normalizedGlobalCode}\n\n` : ''}void setup() {
${normalizedSetupCode}
}

void loop() {
${normalizedLoopCode}
}
`;
}

export function generateMicroPythonTemplate(importLines: string[], setupCode: string, loopCode: string) {
    const normalizedLoopCode = loopCode.trim().length > 0 ? loopCode : '    pass';
    const normalizedSetupCode = setupCode.trim().length > 0 ? setupCode : 'pass';
    const imports = importLines.length > 0 ? importLines.join('\n') : 'import time';

    return `${imports}

# --- Setup Section ---
${normalizedSetupCode}

# --- Loop Section ---
while True:
${normalizedLoopCode}
`;
}
