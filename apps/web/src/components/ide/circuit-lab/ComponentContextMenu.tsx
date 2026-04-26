import React from 'react';

interface ComponentContextMenuProps {
  componentId: string;
  position: { x: number; y: number };
  onDelete: () => void;
  onRotate: () => void;
  onClose: () => void;
}

export function ComponentContextMenu({ position, onDelete, onRotate, onClose }: ComponentContextMenuProps) {
  return (
    <>
      <div 
        className="fixed inset-0 z-[300]" 
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
      />
      <div
        className="fixed z-[310] min-w-[140px] flex flex-col gap-1 rounded-xl border border-white/10 bg-[#08111d]/95 p-1.5 shadow-[0_22px_48px_-26px_rgba(2,6,23,0.95)] backdrop-blur-xl"
        style={{ left: position.x, top: position.y }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRotate();
            onClose();
          }}
          className="rounded-lg px-3 py-1.5 text-left text-[13px] font-medium text-slate-200 transition-colors hover:bg-white/[0.06] hover:text-white"
        >
          Rotate component (R)
        </button>  
        <div className="h-px w-full bg-white/10 my-0.5" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
            onClose();
          }}
          className="rounded-lg px-3 py-1.5 text-left text-[13px] font-medium text-rose-400 transition-colors hover:bg-rose-500/15 hover:text-rose-300"
        >
          Delete
        </button>
      </div>
    </>
  );
}
