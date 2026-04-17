import React, { useState, useEffect, useCallback } from 'react';
import { CircuitBoard, Download, File, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { fadeInUp } from '@/components/ui/motion';
import { useEditorStore } from '@/stores/editorStore';
import { useBoard } from '@/contexts/BoardContext';
import type { useWebSerial } from '@/hooks/useWebSerial';

interface DeviceFile {
    name: string;
    isDir: boolean;
}

function inferFileType(filename: string): string {
    const lower = filename.toLowerCase();
    if (lower.endsWith('.cpp') || lower.endsWith('.ino') || lower.endsWith('.h')) return 'cpp';
    if (lower.endsWith('.py')) return 'python';
    if (lower.endsWith('.blockly') || lower.endsWith('.xml')) return 'blockly';
    return 'text';
}

export default function DeviceFiles({ webSerial }: { webSerial: ReturnType<typeof useWebSerial> }) {
    const { isConnected, runMicroPythonCommand, isFlashing } = webSerial;
    const { compileStrategy } = useBoard();
    const [files, setFiles] = useState<DeviceFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const createFile = useEditorStore((state) => state.createFile);

    const fetchFiles = useCallback(async () => {
        if (!isConnected || compileStrategy !== 'micropython-flash' || isFlashing) {
            setFiles([]);
            return;
        }
        setIsLoading(true);
        try {
            const script = `
import os
def _ls():
 res=[]
 for f in os.listdir():
  try:
   s=os.stat(f)
   res.append('{"name":"'+f+'","isDir":'+('true' if s[0] & 0x4000 else 'false')+'}')
  except: pass
 print('['+','.join(res)+']')
_ls()
`;
            const out = await runMicroPythonCommand(script);
            if (out) {
                const cleanOut = out.trim();
                if (cleanOut.startsWith('[') && cleanOut.endsWith(']')) {
                    const parsed = JSON.parse(cleanOut);
                    setFiles(parsed);
                } else {
                    console.error('Failed to parse device files:', cleanOut);
                }
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [isConnected, compileStrategy, isFlashing, runMicroPythonCommand]);

    useEffect(() => {
        fetchFiles();
    }, [fetchFiles]);

    const handleReadFile = async (filename: string) => {
        setIsLoading(true);
        try {
            const script = `
try:
 with open('${filename}','r') as f:
  print('====BEGIN====')
  print(f.read())
  print('====END====')
except Exception as e:
 print('ERROR:', e)
`;
            const out = await runMicroPythonCommand(script);
            if (out.includes('====BEGIN====') && out.includes('====END====')) {
                const content = out.split('====BEGIN====')[1].split('====END====')[0].replace(/^\n/, '').replace(/\n$/, '');
                await createFile(filename, inferFileType(filename), null, content);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            className="flex h-full w-full flex-col overflow-hidden"
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
        >
            <div className="border-b border-[color:var(--ui-border-soft)] px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--ui-color-text-soft)]">
                            <CircuitBoard size={13} className="text-[var(--ui-color-accent)]" />
                            Device files
                        </div>
                    </div>
                    <Button
                        variant="secondary"
                        icon={<RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />}
                        onClick={fetchFiles}
                        disabled={!isConnected || isLoading}
                        className="min-h-10 rounded-[16px] px-4 py-2 text-sm"
                    >
                        Refresh
                    </Button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-4">
                {!isConnected ? (
                    <div className="ui-quiet-surface rounded-[18px] px-4 py-5 text-sm text-[var(--ui-color-text-muted)]">
                        Connect a board to browse device files.
                    </div>
                ) : compileStrategy !== 'micropython-flash' ? (
                    <div className="ui-quiet-surface rounded-[18px] px-4 py-5 text-sm text-[var(--ui-color-text-muted)]">
                        Device files are available on MicroPython workflows only.
                    </div>
                ) : isLoading ? (
                    <div className="space-y-3">
                        {[0, 1, 2].map((item) => (
                            <div key={item} className="ui-elevated-surface rounded-[18px] px-4 py-4 animate-pulse">
                                <div className="h-4 w-32 rounded-full bg-[color:var(--ui-border-strong)]" />
                            </div>
                        ))}
                    </div>
                ) : files.length === 0 ? (
                    <div className="ui-quiet-surface rounded-[18px] px-4 py-5 text-sm text-[var(--ui-color-text-muted)]">
                        No files found on the device yet.
                    </div>
                ) : (
                    <div className="space-y-3">
                        {files.map((file) => (
                            <div key={file.name} className="ui-elevated-surface flex items-center justify-between gap-3 rounded-[18px] px-4 py-4">
                                <div className="flex min-w-0 items-center gap-3">
                                    <div className="ui-icon-surface flex h-10 w-10 items-center justify-center rounded-[14px]">
                                        <File size={16} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-semibold text-[var(--ui-color-text)]">{file.name}</p>
                                        <p className="text-[11px] uppercase tracking-[0.14em] text-[var(--ui-color-text-soft)]">
                                            {file.isDir ? 'Folder' : 'File'}
                                        </p>
                                    </div>
                                </div>

                                {!file.isDir ? (
                                    <Button
                                        variant="secondary"
                                        icon={<Download size={14} />}
                                        onClick={() => handleReadFile(file.name)}
                                        className="min-h-10 rounded-[16px] px-4 py-2 text-sm"
                                    >
                                        Import
                                    </Button>
                                ) : null}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

