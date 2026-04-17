import { useCallback, useEffect, useRef } from 'react';
import type { SerialMessageSink } from './types';
import type { SerialTransportController } from './useSerialTransport';

interface UseMicroPythonProtocolOptions {
  isConnected: boolean;
  addMessage: SerialMessageSink;
  transport: Pick<SerialTransportController, 'setChunkListener' | 'writeBytes'>;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useMicroPythonProtocol({ isConnected, addMessage, transport }: UseMicroPythonProtocolOptions) {
  const outputCaptureRef = useRef<{
    active: boolean;
    buffer: string;
    onComplete: ((data: string) => void) | null;
  }>({ active: false, buffer: '', onComplete: null });

  const handleIncomingChunk = useCallback((chunk: string) => {
    if (!outputCaptureRef.current.active) {
      return;
    }

    outputCaptureRef.current.buffer += chunk;
    if (!outputCaptureRef.current.buffer.includes('\x04>')) {
      return;
    }

    outputCaptureRef.current.active = false;
    const onComplete = outputCaptureRef.current.onComplete;
    outputCaptureRef.current.onComplete = null;
    onComplete?.(outputCaptureRef.current.buffer);
  }, []);

  useEffect(() => {
    transport.setChunkListener(handleIncomingChunk);
    return () => {
      transport.setChunkListener(null);
    };
  }, [handleIncomingChunk, transport]);

  const executeMicroPythonRaw = useCallback(async (code: string) => {
    if (!isConnected) {
      addMessage('error', 'Cannot execute: Board not connected.');
      return;
    }

    addMessage('system', 'Uploading to board (Raw REPL)...');

    try {
      await transport.writeBytes(new Uint8Array([0x03, 0x03]));
      await sleep(100);
      await transport.writeBytes(new Uint8Array([0x01]));
      await sleep(50);

      const encoder = new TextEncoder();
      await transport.writeBytes(encoder.encode(code));
      await transport.writeBytes(new Uint8Array([0x04]));
      await sleep(100);
      await transport.writeBytes(new Uint8Array([0x02]));
    } catch (error) {
      addMessage('error', `Execution failed: ${(error as Error).message}`);
    }
  }, [addMessage, isConnected, transport]);

  const runMicroPythonCommand = useCallback(async (code: string, timeoutMs: number = 8000): Promise<string> => {
    if (!isConnected) {
      throw new Error('Board not connected.');
    }

    return new Promise<string>(async (resolve, reject) => {
      outputCaptureRef.current = {
        active: true,
        buffer: '',
        onComplete: async (data: string) => {
          clearTimeout(timeoutId);
          await transport.writeBytes(new Uint8Array([0x02]));

          let output = data;
          if (output.startsWith('OK')) {
            output = output.substring(2);
          }

          const parts = output.split('\x04');
          resolve(parts.length > 0 ? parts[0] : output);
        },
      };

      const timeoutId = setTimeout(() => {
        outputCaptureRef.current.active = false;
        outputCaptureRef.current.onComplete = null;
        reject(new Error('Command timeout'));
      }, timeoutMs);

      try {
        await transport.writeBytes(new Uint8Array([0x03, 0x03]));
        await sleep(100);
        await transport.writeBytes(new Uint8Array([0x01]));
        await sleep(50);

        const encoder = new TextEncoder();
        await transport.writeBytes(encoder.encode(code));
        await transport.writeBytes(new Uint8Array([0x04]));
      } catch (error) {
        clearTimeout(timeoutId);
        outputCaptureRef.current.active = false;
        outputCaptureRef.current.onComplete = null;
        reject(error);
      }
    });
  }, [isConnected, transport]);

  return {
    executeMicroPythonRaw,
    runMicroPythonCommand,
  };
}