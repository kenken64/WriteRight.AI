'use client';

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { HighlightColor } from '@/lib/api/client';

const COLORS: { key: HighlightColor; bg: string; label: string }[] = [
  { key: 'yellow', bg: 'bg-yellow-200', label: 'Yellow' },
  { key: 'green', bg: 'bg-green-200', label: 'Green' },
  { key: 'blue', bg: 'bg-blue-200', label: 'Blue' },
  { key: 'pink', bg: 'bg-pink-200', label: 'Pink' },
  { key: 'orange', bg: 'bg-orange-200', label: 'Orange' },
];

interface HighlightColorPickerProps {
  rect: DOMRect;
  onPick: (color: HighlightColor) => void;
  onDismiss: () => void;
}

export function HighlightColorPicker({ rect, onPick, onDismiss }: HighlightColorPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onDismiss();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onDismiss();
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onDismiss]);

  // Position above the selection, centered
  const top = rect.top + window.scrollY - 44;
  const left = rect.left + window.scrollX + rect.width / 2;

  return createPortal(
    <div
      ref={ref}
      className="fixed z-50 flex items-center gap-1.5 rounded-lg border bg-white px-2 py-1.5 shadow-lg"
      style={{
        top: `${top}px`,
        left: `${left}px`,
        transform: 'translate(-50%, 0)',
      }}
    >
      {COLORS.map(({ key, bg, label }) => (
        <button
          key={key}
          onClick={() => onPick(key)}
          title={label}
          className={`h-6 w-6 rounded-full ${bg} border border-gray-300 hover:scale-110 hover:ring-2 hover:ring-gray-400 transition-transform`}
        />
      ))}
    </div>,
    document.body,
  );
}
