import React from 'react';
import Editor from '@monaco-editor/react';

interface TextEditorProps {
    code: string;
    language: string;
    onChange?: (val: string) => void;
    readOnly?: boolean;
    hideHeader?: boolean;
}

export default function TextEditor({
    code,
    language,
    onChange,
    readOnly = false,
    hideHeader = false
}: TextEditorProps) {

    return (
        <div className="h-full w-full flex flex-col bg-slate-950 text-slate-100">
            {!hideHeader && (
                <div className="flex h-9 items-center justify-between border-b border-slate-700 bg-slate-900 px-4 text-xs font-medium text-slate-400">
                    <span>{language === 'cpp' ? 'main.cpp' : 'main.py'}</span>
                    <span>{language === 'cpp' ? 'Arduino C++' : 'MicroPython'}</span>
                </div>
            )}
            <div className="flex-1">
                <Editor
                    height="100%"
                    language={language}
                    theme="vs-dark"
                    value={code}
                    onChange={(val) => {
                        if (onChange && val !== undefined && !readOnly) {
                            onChange(val);
                        }
                    }}
                    options={{
                        readOnly,
                        minimap: { enabled: false },
                        fontSize: 14,
                        padding: { top: 14, bottom: 14 },
                        scrollBeyondLastLine: false,
                        smoothScrolling: true,
                        lineNumbersMinChars: 3,
                        renderLineHighlightOnlyWhenFocus: true,
                        wordWrap: 'on'
                    }}
                />
            </div>
        </div>
    );
}
