import React, { useState, useEffect } from 'react';
import { CircuitBoard, File, RefreshCw, Download } from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import { useBoard } from '@/contexts/BoardContext';

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

export default function DeviceFiles({ webSerial }: { webSerial: any }) {
    const { isConnected, runMicroPythonCommand, isFlashing } = webSerial;
    const { compileStrategy } = useBoard();
    const [files, setFiles] = useState<DeviceFile[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { createFile } = useProject();

    const fetchFiles = async () => {
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
    };

    useEffect(() => {
        if (isConnected) {
            fetchFiles();
        } else {
            setFiles([]);
        }
    }, [isConnected, compileStrategy, isFlashing]);

    const handleReadFile = async (filename: string) => {
        setIsLoading(true);
        try {
            // Read file and print it inside special tags to easily extract
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
                // Load into IDE with the correct content/type mapping
                await createFile(filename, inferFileType(filename), null, content);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full h-full flex flex-col bg-[#0f111a] border-r border-panel-border hide-scrollbar overflow-hidden">
            {/* Header */}
            <div className="h-8 flex items-center justify-between px-3 shrink-0 bg-[#1e293b]">
                <div className="flex items-center text-emerald-400">
                    <CircuitBoard size={14} className="mr-2" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Device Files</span>
                </div>
                <div className="flex space-x-1">
                    <button onClick={fetchFiles} disabled={!isConnected || isLoading} className="p-1 rounded text-slate-500 hover:text-emerald-400 disabled:opacity-50 transition-colors" title="Refresh">
                        <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* File List */}
            <div className="flex-1 overflow-y-auto py-1">
                {!isConnected ? (
                    <div className="px-3 py-4 text-xs text-slate-500 text-center">Connect board to view device files.</div>
                ) : compileStrategy !== 'micropython-flash' ? (
                    <div className="px-3 py-4 text-xs text-slate-500 text-center">Device files are only supported on MicroPython boards.</div>
                ) : files.length === 0 && !isLoading ? (
                    <div className="px-3 py-2 text-xs text-slate-400 italic">No files on device...</div>
                ) : (
                    files.map((f, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5 px-3 hover:bg-slate-800/40 group transition-colors">
                            <div className="flex items-center text-slate-300">
                                <File size={14} className="mr-2 text-emerald-500/80" />
                                <span className="text-sm truncate">{f.name}</span>
                            </div>
                            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!f.isDir && (
                                    <button onClick={() => handleReadFile(f.name)} className="p-1 text-slate-400 hover:text-white" title="Download to Workspace">
                                        <Download size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}