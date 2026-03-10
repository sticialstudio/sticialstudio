import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Trash2, Settings, Link as LinkIcon, Unlink } from 'lucide-react';

export default function ConsolePanel({ webSerial }: { webSerial: any }) {
    const { isConnected, messages, connect, disconnect, writeText, clearMessages } = webSerial;
    const [baudRate, setBaudRate] = useState(9600);
    const [inputValue, setInputValue] = useState('');

    // Auto-scroll to bottom of messages
    const messagesEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleConnectClick = () => {
        if (isConnected) {
            disconnect();
        } else {
            connect(baudRate);
        }
    };

    const [history, setHistory] = useState<string[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const handleSend = () => {
        if (inputValue.trim()) {
            writeText(inputValue);
            setHistory(prev => [inputValue, ...prev].slice(0, 50));
            setHistoryIndex(-1);
            setInputValue(''); // Clear input after sending
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSend();
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (history.length > 0 && historyIndex < history.length - 1) {
                const newIndex = historyIndex + 1;
                setHistoryIndex(newIndex);
                setInputValue(history[newIndex]);
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (historyIndex > 0) {
                const newIndex = historyIndex - 1;
                setHistoryIndex(newIndex);
                setInputValue(history[newIndex]);
            } else if (historyIndex === 0) {
                setHistoryIndex(-1);
                setInputValue('');
            }
        }
    };

    return (
        <div className="h-full w-full flex flex-col bg-[#050505] text-slate-300 font-mono text-sm shadow-inner relative">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between px-4 py-2 bg-[#0f111a] border-b border-panel-border z-10">
                <div className="flex items-center space-x-4">
                    <span className="flex items-center text-accent font-bold tracking-tight">
                        <Terminal size={14} className="mr-2" />
                        TERMINAL
                    </span>
                    <button
                        onClick={handleConnectClick}
                        className={`flex items-center space-x-1 text-xs px-2 py-1 rounded transition-colors ${isConnected
                            ? 'bg-red-900/50 text-red-400 hover:bg-red-900/80 border border-red-800'
                            : 'bg-emerald-900/50 text-emerald-400 hover:bg-emerald-900/80 border border-emerald-800'
                            }`}
                    >
                        {isConnected ? <><Unlink size={12} /><span>Disconnect</span></> : <><LinkIcon size={12} /><span>Connect</span></>}
                    </button>
                    <div className="flex items-center space-x-2 text-xs">
                        <span className="text-slate-500 uppercase tracking-wider text-[10px]">Baud</span>
                        <select
                            value={baudRate}
                            onChange={(e) => setBaudRate(Number(e.target.value))}
                            disabled={isConnected}
                            className="bg-slate-800/80 border border-slate-700 rounded px-2 py-0.5 text-slate-300 disabled:opacity-50 focus:ring-1 focus:ring-accent focus:outline-none transition-colors"
                        >
                            <option value={9600}>9600</option>
                            <option value={19200}>19200</option>
                            <option value={38400}>38400</option>
                            <option value={57600}>57600</option>
                            <option value={115200}>115200</option>
                        </select>
                    </div>
                </div>
                <div className="flex items-center space-x-3 text-slate-400">
                    <button className="hover:text-amber-400 transition-colors" title="Settings">
                        <Settings size={14} />
                    </button>
                    <button onClick={clearMessages} className="hover:text-red-400 transition-colors" title="Clear output">
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Serial Output Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
                {messages.length === 0 ? (
                    <div className="opacity-50 italic text-center mt-4">No serial data yet...</div>
                ) : (
                    messages.map((msg: import('../../hooks/useWebSerial').SerialMessage, index: number) => {
                        let prefix = '';
                        let colorClass = 'text-slate-300';

                        switch (msg.type) {
                            case 'system':
                                prefix = '[System] ';
                                colorClass = 'text-blue-400 font-bold';
                                break;
                            case 'error':
                                prefix = '[Error] ';
                                colorClass = 'text-red-400';
                                break;
                            case 'sent':
                                prefix = '-> ';
                                colorClass = 'text-emerald-400 italic';
                                break;
                            case 'app':
                            default:
                                prefix = '';
                                colorClass = 'text-slate-200';
                                break;
                        }

                        return (
                            <div key={index} className="break-all whitespace-pre-wrap">
                                <span className={colorClass}>{prefix}</span>
                                <span className={msg.type === 'app' ? 'text-slate-300' : colorClass}>
                                    {msg.text}
                                </span>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input line */}
            <div className="p-2 bg-[#0a0c10] border-t border-panel-border flex items-center group">
                <span className="text-accent mr-2 font-bold group-focus-within:animate-pulse">&gt;</span>
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={!isConnected}
                    className="flex-1 bg-transparent outline-none text-slate-200 placeholder-slate-700 disabled:opacity-50"
                    placeholder={isConnected ? "Type message to send... (Enter to submit)" : "Connect to a device to send messages"}
                />
                <button
                    onClick={handleSend}
                    disabled={!isConnected || !inputValue.trim()}
                    className="text-xs px-4 py-1.5 bg-accent text-white font-bold rounded hover:bg-accent-hover transition-all disabled:opacity-30 disabled:bg-slate-800 uppercase tracking-wider"
                >
                    Send
                </button>
            </div>
        </div>
    );
}
