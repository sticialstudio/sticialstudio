import React, { useState, useRef, useEffect } from 'react';
import { Link as LinkIcon, RotateCcw, SendHorizontal, Terminal, Unlink } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export default function ConsolePanel({ webSerial }: { webSerial: any }) {
    const { isConnected, messages, connect, disconnect, writeText, clearMessages } = webSerial;
    const [baudRate, setBaudRate] = useState(9600);
    const [inputValue, setInputValue] = useState('');

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
            setInputValue('');
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
        <div
            className="flex h-full w-full min-h-0 flex-col overflow-hidden"
            style={{
                background: 'linear-gradient(180deg, color-mix(in srgb, var(--ui-surface-quiet) 96%, black 4%) 0%, color-mix(in srgb, var(--ui-color-background) 92%, black 8%) 100%)',
            }}
        >
            <div className="flex flex-shrink-0 flex-wrap items-center justify-between gap-2 border-b border-[color:var(--ui-border-soft)] px-4 py-2">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em] text-[var(--ui-color-primary)]">
                        <Terminal size={14} />
                        Terminal
                    </span>
                    <Button
                        variant="secondary"
                        icon={isConnected ? <Unlink size={14} /> : <LinkIcon size={14} />}
                        onClick={handleConnectClick}
                        className={`min-h-9 rounded-[12px] px-3 py-2 text-xs ${
                            isConnected
                                ? 'border-emerald-400/20 bg-emerald-400/12 text-emerald-200 hover:border-emerald-300/30 hover:bg-emerald-400/16'
                                : 'text-[var(--ui-color-text)]'
                        }`}
                    >
                        {isConnected ? 'Connected' : 'Connect'}
                    </Button>
                    <span className="ui-pill-surface rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]">
                        {messages.length} messages
                    </span>
                </div>

                <div className="flex items-center gap-2">
                    <label className="ui-pill-surface inline-flex items-center gap-2 rounded-[12px] px-3 py-2 text-xs">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--ui-color-text-soft)]">Baud</span>
                        <select
                            value={baudRate}
                            onChange={(e) => setBaudRate(Number(e.target.value))}
                            disabled={isConnected}
                            className="bg-transparent text-[var(--ui-color-text)] outline-none disabled:opacity-50"
                        >
                            <option value={9600}>9600</option>
                            <option value={19200}>19200</option>
                            <option value={38400}>38400</option>
                            <option value={57600}>57600</option>
                            <option value={115200}>115200</option>
                        </select>
                    </label>
                    <button
                        type="button"
                        onClick={clearMessages}
                        className="ui-pill-surface inline-flex h-9 items-center justify-center rounded-[12px] px-3 text-xs font-semibold uppercase tracking-[0.14em] transition-colors hover:bg-[color:var(--ui-surface-elevated)] hover:text-[var(--ui-color-text)]"
                        title="Clear terminal"
                    >
                        <RotateCcw size={14} className="mr-2" />
                        Clear
                    </button>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3 text-[var(--ui-color-text)]">
                {messages.length === 0 ? (
                    <div className="flex h-full min-h-[80px] items-center justify-center text-center">
                        <div className="space-y-2">
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--ui-color-text-soft)]">No output yet</p>
                            <p className="text-xs text-[var(--ui-color-text-muted)]">Connect a board or run something to see messages here.</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-1.5">
                        {messages.map((msg: import('../../hooks/useWebSerial').SerialMessage, index: number) => {
                            let label = 'App';
                            let toneClass = 'ui-elevated-surface text-[var(--ui-color-text)]';

                            switch (msg.type) {
                                case 'system':
                                    label = 'System';
                                    toneClass = 'border border-sky-400/18 bg-sky-400/10 text-sky-100';
                                    break;
                                case 'error':
                                    label = 'Error';
                                    toneClass = 'border border-rose-400/20 bg-rose-400/10 text-rose-100';
                                    break;
                                case 'sent':
                                    label = 'Sent';
                                    toneClass = 'border border-emerald-400/20 bg-emerald-400/10 text-emerald-100';
                                    break;
                            }

                            return (
                                <div key={index} className={`rounded-[10px] px-3 py-2 ${toneClass}`}>
                                    <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] opacity-80">{label}</div>
                                    <div className="break-all whitespace-pre-wrap text-xs leading-5">{msg.text}</div>
                                </div>
                            );
                        })}
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="flex-shrink-0 border-t border-[color:var(--ui-border-soft)] px-3 py-2">
                <div className="ui-input-surface flex items-center gap-2 rounded-[10px] px-3 py-1.5">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={!isConnected}
                        className="flex-1 bg-transparent text-xs text-[var(--ui-color-text)] outline-none placeholder:text-[var(--ui-color-text-soft)] disabled:opacity-50"
                        placeholder={isConnected ? 'Send a message to the board' : 'Connect a device to send messages'}
                    />
                    <Button
                        icon={<SendHorizontal size={13} />}
                        onClick={handleSend}
                        disabled={!isConnected || !inputValue.trim()}
                        className="min-h-8 rounded-[8px] bg-[color:var(--ui-color-primary)]/12 px-3 py-1.5 text-xs text-[var(--ui-color-primary-strong)] shadow-none hover:bg-[color:var(--ui-color-primary)]/20"
                    >
                        Send
                    </Button>
                </div>
            </div>
        </div>
    );
}
