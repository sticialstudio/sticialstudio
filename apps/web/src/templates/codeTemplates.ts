// ── Default boilerplate code (matches Arduino IDE 2 defaults) ─────────────────

export const DEFAULT_ARDUINO_CODE = `void setup() {
  // put your setup code here, to run once:

}

void loop() {
  // put your main code here, to run repeatedly:

}
`;

export const DEFAULT_MICROPYTHON_CODE = `import time

# --- Setup ---
# Runs once at startup


# --- Main Loop ---
while True:
    # put your main code here, to run repeatedly:
    time.sleep(1)
`;

// ── Template generators (used by Blockly code generation) ─────────────────────

export function generateArduinoTemplate(globalCode: string, setupCode: string, loopCode: string) {
    const normalizedSetupCode = setupCode.trim().length > 0 ? setupCode : '';
    const normalizedLoopCode = loopCode.trim().length > 0 ? loopCode : '';
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
    const normalizedSetupCode = setupCode.trim().length > 0 ? setupCode : '';
    const imports = importLines.length > 0 ? importLines.join('\n') : 'import time';

    return `${imports}

# --- Setup Section ---
${normalizedSetupCode}

# --- Loop Section ---
while True:
${normalizedLoopCode}
`;
}

