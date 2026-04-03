import { useState, useRef, useCallback, useEffect } from 'react';
import { Duplex } from 'stream-browserify';
import STK500 from 'stk500-esm';
export interface SerialMessage {
    type: 'system' | 'app' | 'error' | 'sent';
    text: string;
    timestamp: number;
}

export function useWebSerial() {
    const [isConnected, setIsConnected] = useState(false);
    const [isFlashing, setIsFlashing] = useState(false);
    const [messages, setMessages] = useState<SerialMessage[]>([]);

    // Web Serial references
    const portRef = useRef<SerialPort | null>(null);
    const readerRef = useRef<ReadableStreamDefaultReader | null>(null);
    const writerRef = useRef<WritableStreamDefaultWriter | null>(null);
    const textDecoderRef = useRef<TextDecoderStream | null>(null);
    const baudRateRef = useRef<number>(9600);

    // Manage read loop lifecycle
    const keepReadingRef = useRef(true);
    const pipeAbortControllerRef = useRef<AbortController | null>(null);

    const addMessage = useCallback((type: SerialMessage['type'], text: string) => {
        setMessages(prev => {
            const next = [...prev, { type, text, timestamp: Date.now() }];
            if (next.length > 500) return next.slice(next.length - 500);
            return next;
        });
    }, []);

    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    const outputCaptureRef = useRef<{ active: boolean; buffer: string; onComplete: ((data: string) => void) | null }>({ active: false, buffer: '', onComplete: null });

    const readLoop = useCallback(async () => {
        let buffer = '';
        while (portRef.current?.readable && keepReadingRef.current && readerRef.current) {
            try {
                const { value, done } = await readerRef.current.read();
                if (done) break;
                if (value) {
                    if (outputCaptureRef.current.active) {
                        outputCaptureRef.current.buffer += value;
                        if (outputCaptureRef.current.buffer.includes('\x04>')) {
                            outputCaptureRef.current.active = false;
                            if (outputCaptureRef.current.onComplete) {
                                outputCaptureRef.current.onComplete(outputCaptureRef.current.buffer);
                                outputCaptureRef.current.onComplete = null;
                            }
                        }
                    }

                    buffer += value;
                    // Split by newline and add complete lines to messages
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || ''; // Keep the incomplete line in the buffer

                    lines.forEach(line => {
                        if (line.trim() !== '' || line === '\r') {
                            addMessage('app', line.replace(/\r$/, ''));
                        }
                    });
                }
            } catch (error) {
                // Ignore non-fatal port closure errors
                if (keepReadingRef.current) {
                    addMessage('error', `Read error: ${(error as Error).message}`);
                }
                break;
            }
        }
    }, [addMessage]);

    const connect = useCallback(async (baudRate: number) => {
        if (!('serial' in navigator)) {
            addMessage('error', 'Web Serial API is not supported in this browser. Please use Chrome or Edge.');
            return;
        }

        try {
            // Prompt user for port
            const port = await navigator.serial.requestPort();
            await port.open({ baudRate });

            portRef.current = port;
            baudRateRef.current = baudRate;
            setIsConnected(true);
            keepReadingRef.current = true;

            const textDecoder = new TextDecoderStream();
            const abortController = new AbortController();
            pipeAbortControllerRef.current = abortController;

            port.readable.pipeTo(textDecoder.writable, { signal: abortController.signal }).catch(() => { });
            readerRef.current = textDecoder.readable.getReader();
            textDecoderRef.current = textDecoder;

            const info = port.getInfo();
            addMessage('system', `Connected to device (VID: ${info.usbVendorId}, PID: ${info.usbProductId}) at ${baudRate} baud`);

            // Start the read loop in the background
            readLoop();
        } catch (error) {
            const err = error as Error;
            // Handle user cancelling the prompt gracefully
            if (err.name === 'NotFoundError') {
                addMessage('error', 'No port selected.');
            } else {
                addMessage('error', `Connection failed: ${err.message}`);
            }
        }
    }, [addMessage, readLoop]);

    const disconnect = useCallback(async () => {
        // Stop the read loop
        keepReadingRef.current = false;

        try {
            // Cancel reader stream
            if (readerRef.current) {
                await readerRef.current.cancel();
                readerRef.current = null;
            }
            if (textDecoderRef.current) {
                textDecoderRef.current = null;
            }
            // Close writer stream
            if (writerRef.current) {
                await writerRef.current.close();
                writerRef.current = null;
            }
            // Close the physical port
            if (portRef.current) {
                await portRef.current.close();
                portRef.current = null;
            }
            setIsConnected(false);
            addMessage('system', 'Disconnected from device.');
        } catch (error) {
            addMessage('error', `Disconnect error: ${(error as Error).message}`);
        }
    }, [addMessage]);

    const writeText = useCallback(async (text: string) => {
        if (!portRef.current?.writable) {
            addMessage('error', 'Port not writable or not connected.');
            return;
        }

        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(text + '\n');

            const writer = portRef.current.writable.getWriter();
            writerRef.current = writer;
            await writer.write(data);
            writer.releaseLock();
            writerRef.current = null;

            addMessage('sent', text);
        } catch (error) {
            addMessage('error', `Write error: ${(error as Error).message}`);
        }
    }, [addMessage]);

    // Cleanup and handle unexpected physical disconnection (e.g. unplugging cable)
    useEffect(() => {
        const handleDisconnect = (e: Event) => {
            // If the disconnected device is our device, we update state
            setIsConnected(false);
            keepReadingRef.current = false;
            if (portRef.current) {
                portRef.current = null;
            }
            addMessage('error', 'Device disconnected unexpectedly.');
        };

        if ('serial' in navigator) {
            navigator.serial.addEventListener('disconnect', handleDisconnect);
        }
        return () => {
            if ('serial' in navigator) {
                navigator.serial.removeEventListener('disconnect', handleDisconnect);
            }
        };
    }, [addMessage]);

    const writeBytes = useCallback(async (data: Uint8Array) => {
        if (!portRef.current?.writable) {
            addMessage('error', 'Port not writable or not connected.');
            return;
        }

        try {
            const writer = portRef.current.writable.getWriter();
            writerRef.current = writer;
            await writer.write(data);
            writer.releaseLock();
            writerRef.current = null;
        } catch (error) {
            addMessage('error', `WriteBytes error: ${(error as Error).message}`);
        }
    }, [addMessage]);

    const executeMicroPythonRaw = useCallback(async (code: string) => {
        if (!isConnected) {
            addMessage('error', 'Cannot execute: Board not connected.');
            return;
        }

        addMessage('system', 'Uploading to board (Raw REPL)...');

        // MicroPython Raw REPL Flow:
        // 1. Enter Raw REPL:  \x01 (Ctrl-A)
        // 2. Clear out anything stuck in the input buffer.
        // 3. Enter paste mode (wait for prompt). We just send the code directly in raw repl.
        // 4. Send the code.
        // 5. Execute: \x04 (Ctrl-D)
        // 6. Exit Raw REPL (optional, but good so user can interact natively again): \x02 (Ctrl-B)

        try {
            // Double Ctrl-C (interrupt) to break any deep sleep or infinite loop
            await writeBytes(new Uint8Array([0x03, 0x03]));
            await new Promise(resolve => setTimeout(resolve, 100));

            // Enter Raw REPL (Ctrl-A)
            await writeBytes(new Uint8Array([0x01]));
            await new Promise(resolve => setTimeout(resolve, 50));

            // Send standard code string as utf8 encoded bytes
            const encoder = new TextEncoder();
            const codeBytes = encoder.encode(code);
            await writeBytes(codeBytes);

            // Execute the buffer in Raw REPL (Ctrl-D)
            await writeBytes(new Uint8Array([0x04]));

            // Brief delay to allow execution catching
            await new Promise(resolve => setTimeout(resolve, 100));

            // Exit Raw REPL gracefully (Ctrl-B)
            await writeBytes(new Uint8Array([0x02]));

        } catch (error) {
            addMessage('error', `Execution failed: ${(error as Error).message}`);
        }
    }, [isConnected, writeBytes, addMessage]);

    const runMicroPythonCommand = useCallback(async (code: string, timeoutMs: number = 8000): Promise<string> => {
        if (!isConnected) throw new Error('Board not connected.');

        return new Promise<string>(async (resolve, reject) => {
            outputCaptureRef.current = {
                active: true,
                buffer: '',
                onComplete: async (data: string) => {
                    clearTimeout(timeoutId);
                    await writeBytes(new Uint8Array([0x02])); // Exit Raw REPL

                    // Parse the rawOutput string. 
                    // Raw REPL output format: "OK" + <output> + "\x04" + <error> + "\x04>"
                    let output = data;
                    if (output.startsWith('OK')) output = output.substring(2);
                    const parts = output.split('\x04');
                    if (parts.length > 0) resolve(parts[0]);
                    else resolve(output);
                }
            };

            const timeoutId = setTimeout(() => {
                outputCaptureRef.current.active = false;
                reject(new Error('Command timeout'));
            }, timeoutMs);

            try {
                await writeBytes(new Uint8Array([0x03, 0x03]));
                await new Promise(r => setTimeout(r, 100));
                await writeBytes(new Uint8Array([0x01]));
                await new Promise(r => setTimeout(r, 50));

                const encoder = new TextEncoder();
                await writeBytes(encoder.encode(code));
                await writeBytes(new Uint8Array([0x04]));
            } catch (error) {
                clearTimeout(timeoutId);
                outputCaptureRef.current.active = false;
                reject(error);
            }
        });
    }, [isConnected, writeBytes]);

    const flashArduino = useCallback(async (hexData: string) => {
        if (typeof window === 'undefined' || !('serial' in navigator)) return;
        if (!portRef.current) {
            addMessage('error', 'Cannot flash Arduino: Board not connected.');
            return;
        }

        let keepReadingBridge = true;
        let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
        let writer: WritableStreamDefaultWriter<Uint8Array> | undefined;

        try {
            setIsFlashing(true);
            addMessage('system', 'Starting Arduino Flash Sequence...');

            // STK500 requires a duplex stream. We build a manual bridge between the 
            // browser's Web Serial Stream API and the expected Node.js Duplex Stream.
            const port = portRef.current;

            // 1. Force hardware reset by toggling DTR/RTS
            addMessage('system', 'Pulsing DTR to reset board...');
            const anyPort = port as any;
            // High
            await anyPort.setSignals({ dataTerminalReady: false, requestToSend: false });
            await new Promise(r => setTimeout(r, 250));
            // Assert (Low)
            await anyPort.setSignals({ dataTerminalReady: true, requestToSend: true });
            await new Promise(r => setTimeout(r, 50));
            // De-assert (High) - Bootloader starts now
            await anyPort.setSignals({ dataTerminalReady: false, requestToSend: false });
            await new Promise(r => setTimeout(r, 50));

            // Stop the standard read loop so STK can command the stream securely
            keepReadingRef.current = false;

            // Crucial Fix: Web Serial pipeTo() locks the readable stream permanently unless aborted 
            // via the AbortSignal passed to it during creation.
            if (readerRef.current) {
                await readerRef.current.cancel().catch(() => { });
                readerRef.current = null;
            }
            if (pipeAbortControllerRef.current) {
                pipeAbortControllerRef.current.abort();
                pipeAbortControllerRef.current = null;
            }
            if (textDecoderRef.current) {
                await new Promise(r => setTimeout(r, 100)); // allow pipe chain to unwind
                textDecoderRef.current = null;
            }
            if (writerRef.current) {
                await writerRef.current.close().catch(() => { });
                writerRef.current = null;
            }

            // Web Serial API does not support changing baud rate on the fly.
            // We must close the port and reopen it at 115200 for the STK500 bootloader.
            await port.close();
            await new Promise(r => setTimeout(r, 50));
            await port.open({ baudRate: 115200 });

            // Obtain raw locks directly from the physical port
            reader = port.readable!.getReader();
            writer = port.writable!.getWriter();

            // Construct our Node.js Polyfill Pipeline Adapter
            const streamBridge = new Duplex({
                read() { }, // Will be fed manually
                write(chunk: any, encoding: string, callback: (error?: Error | null) => void) {
                    writer!.write(chunk).then(() => {
                        callback();
                    }).catch(err => {
                        callback(err);
                    });
                }
            });

            // Run a continuous background reader to feed the STK500 Duplex
            const bridgeReadLoop = async () => {
                while (keepReadingBridge) {
                    try {
                        const { value, done } = await reader!.read();
                        if (done) break;
                        if (value) {
                            streamBridge.push(Buffer.from(value));
                        }
                    } catch (e) {
                        break;
                    }
                }
            };
            bridgeReadLoop();

            // Configure standard AVR UNO board definition for STK500v1
            const boardConfig = {
                name: "Arduino Uno",
                baudRate: 115200,
                signature: new Uint8Array([0x1e, 0x95, 0x0f]), // ATmega328P
                pageSize: 128,
                timeout: 400,
            };

            addMessage('system', 'Syncing STK500 protocol...');
            const stk = new STK500(streamBridge as any, boardConfig);

            await stk.bootload(hexData, (status, percentage) => {
                if (percentage % 25 === 0) { // Keep noise down
                    addMessage('system', `Flash Progress:: ${status} - ${percentage.toFixed(0)}%`);
                }
            });

            addMessage('system', 'ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Flash Complete. Restarting board...');

            // Tear down bridge safely
            keepReadingBridge = false;
            streamBridge.destroy();
            await reader.cancel().catch(() => { });
            try { reader.releaseLock(); } catch (e) { }
            try { writer.releaseLock(); } catch (e) { }

            // Reactivate standard REPL read pipeline by restoring the original baud rate
            keepReadingRef.current = true;

            await port.close();
            await new Promise(r => setTimeout(r, 50));
            await port.open({ baudRate: baudRateRef.current });

            const textDecoder = new TextDecoderStream();
            const abortController = new AbortController();
            pipeAbortControllerRef.current = abortController;
            port.readable!.pipeTo(textDecoder.writable, { signal: abortController.signal }).catch(() => { });

            readerRef.current = textDecoder.readable.getReader();
            textDecoderRef.current = textDecoder;

            readLoop();

        } catch (error) {
            keepReadingBridge = false;
            try { reader?.cancel().catch(() => { }); } catch (e) { }
            try { reader?.releaseLock(); } catch (e) { }
            try { writer?.releaseLock(); } catch (e) { }

            addMessage('error', `STK500 Flashing failed: ${(error as Error).message}`);
            // Attempt recovery if crashed mid-flash
            try {
                const port = portRef.current;
                if (!port) return;

                // Restore original baud rate
                await port.close().catch(() => { });
                await new Promise(r => setTimeout(r, 50));
                await port.open({ baudRate: baudRateRef.current }).catch(() => { });

                keepReadingRef.current = true;
                const textDecoder = new TextDecoderStream();
                const abortController = new AbortController();
                pipeAbortControllerRef.current = abortController;
                port.readable!.pipeTo(textDecoder.writable, { signal: abortController.signal }).catch(() => { });

                readerRef.current = textDecoder.readable.getReader();
                textDecoderRef.current = textDecoder;
                readLoop();
            } catch (e) { }
        } finally {
            setIsFlashing(false);
        }
    }, [addMessage, readLoop]);

    return {
        isConnected,
        isFlashing,
        messages,
        connect,
        disconnect,
        writeText,
        writeBytes,
        executeMicroPythonRaw,
        runMicroPythonCommand,
        flashArduino,
        clearMessages,
        addMessage
    };
}

