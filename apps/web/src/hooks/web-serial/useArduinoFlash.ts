import { useCallback, useState } from 'react';
import { Duplex } from 'stream-browserify';
import STK500 from 'stk500-esm';
import type { SerialMessageSink } from './types';
import type { SerialTransportController } from './useSerialTransport';

interface UseArduinoFlashOptions {
  addMessage: SerialMessageSink;
  transport: Pick<
    SerialTransportController,
    | 'portRef'
    | 'readerRef'
    | 'writerRef'
    | 'baudRateRef'
    | 'keepReadingRef'
    | 'pauseDecodedReadPipeline'
    | 'resumeDecodedReadPipeline'
    | 'reopenPort'
  >;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useArduinoFlash({ addMessage, transport }: UseArduinoFlashOptions) {
  const [isFlashing, setIsFlashing] = useState(false);

  const flashArduino = useCallback(async (hexData: string) => {
    if (typeof window === 'undefined' || !('serial' in navigator)) {
      return;
    }

    const initialPort = transport.portRef.current;
    if (!initialPort) {
      addMessage('error', 'Cannot flash Arduino: Board not connected.');
      return;
    }

    let keepReadingBridge = true;
    let rawReader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    let rawWriter: WritableStreamDefaultWriter<Uint8Array> | undefined;
    let streamBridge: InstanceType<typeof Duplex> | null = null;

    try {
      setIsFlashing(true);
      addMessage('system', 'Starting Arduino flash sequence...');

      const port = transport.portRef.current;
      if (!port) {
        throw new Error('Port disappeared before flashing could start.');
      }

      addMessage('system', 'Pulsing DTR to reset board...');
      const serialPortWithSignals = port as SerialPort & {
        setSignals?: (signals: { dataTerminalReady: boolean; requestToSend: boolean }) => Promise<void>;
      };
      await serialPortWithSignals.setSignals?.({ dataTerminalReady: false, requestToSend: false });
      await sleep(250);
      await serialPortWithSignals.setSignals?.({ dataTerminalReady: true, requestToSend: true });
      await sleep(50);
      await serialPortWithSignals.setSignals?.({ dataTerminalReady: false, requestToSend: false });
      await sleep(50);

      await transport.pauseDecodedReadPipeline();
      await transport.reopenPort(115200);

      const flashingPort = transport.portRef.current;
      if (!flashingPort?.readable || !flashingPort.writable) {
        throw new Error('Serial port is not ready for flashing.');
      }

      rawReader = flashingPort.readable.getReader();
      rawWriter = flashingPort.writable.getWriter();

      streamBridge = new Duplex({
        read() {
          // The STK500 library pulls data from the stream; reads are pushed from the browser loop below.
        },
        write(chunk: Uint8Array, _encoding: BufferEncoding, callback: (error?: Error | null) => void) {
          rawWriter!.write(chunk).then(() => callback()).catch((error) => callback(error));
        },
      });

      const bridgeReadLoop = async () => {
        while (keepReadingBridge) {
          try {
            const { value, done } = await rawReader!.read();
            if (done) {
              break;
            }
            if (value) {
              streamBridge!.push(Buffer.from(value));
            }
          } catch {
            break;
          }
        }
      };
      void bridgeReadLoop();

      const boardConfig = {
        name: 'Arduino Uno',
        baudRate: 115200,
        signature: new Uint8Array([0x1e, 0x95, 0x0f]),
        pageSize: 128,
        timeout: 400,
      };

      addMessage('system', 'Syncing STK500 protocol...');
      const stk = new STK500(streamBridge as any, boardConfig);
      await stk.bootload(hexData, (status, percentage) => {
        if (percentage % 25 === 0) {
          addMessage('system', `Flash progress: ${status} - ${percentage.toFixed(0)}%`);
        }
      });

      addMessage('system', 'Flash complete. Restarting board...');

      keepReadingBridge = false;
      streamBridge.destroy();
      await rawReader.cancel().catch(() => undefined);
      try {
        rawReader.releaseLock();
      } catch {
        // Ignore lock cleanup errors after successful flashing.
      }
      try {
        rawWriter.releaseLock();
      } catch {
        // Ignore lock cleanup errors after successful flashing.
      }

      transport.keepReadingRef.current = true;
      await transport.reopenPort(transport.baudRateRef.current);
      await transport.resumeDecodedReadPipeline();
    } catch (error) {
      keepReadingBridge = false;
      streamBridge?.destroy();
      try {
        await rawReader?.cancel().catch(() => undefined);
      } catch {
        // Ignore reader cleanup errors during recovery.
      }
      try {
        rawReader?.releaseLock();
      } catch {
        // Ignore stale locks while attempting recovery.
      }
      try {
        rawWriter?.releaseLock();
      } catch {
        // Ignore stale locks while attempting recovery.
      }

      addMessage('error', `STK500 flashing failed: ${(error as Error).message}`);

      try {
        if (transport.portRef.current) {
          await transport.reopenPort(transport.baudRateRef.current);
          await transport.resumeDecodedReadPipeline();
        }
      } catch {
        // Best-effort recovery only.
      }
    } finally {
      setIsFlashing(false);
    }
  }, [addMessage, transport]);

  return {
    isFlashing,
    flashArduino,
  };
}