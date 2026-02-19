'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Loader2 } from 'lucide-react';
import type { HighlightColor, StudentNote } from '@/lib/api/client';

const COLORS: { key: HighlightColor; bg: string; label: string }[] = [
  { key: 'yellow', bg: 'bg-yellow-200', label: 'Yellow' },
  { key: 'green', bg: 'bg-green-200', label: 'Green' },
  { key: 'blue', bg: 'bg-blue-200', label: 'Blue' },
  { key: 'pink', bg: 'bg-pink-200', label: 'Pink' },
  { key: 'orange', bg: 'bg-orange-200', label: 'Orange' },
];

const PRIORITY_BADGE: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low: 'bg-green-100 text-green-700',
};

export type HighlightConfirmPayload =
  | { color: HighlightColor; noteId: string }
  | { color: HighlightColor; newNoteContent: string }
  | { color: HighlightColor; noteId?: undefined; newNoteContent?: undefined };

interface HighlightColorPickerProps {
  rect: DOMRect;
  notes: StudentNote[];
  onConfirm: (payload: HighlightConfirmPayload) => void;
  onDismiss: () => void;
  isCreating?: boolean;
}

export function HighlightColorPicker({
  rect,
  notes,
  onConfirm,
  onDismiss,
  isCreating,
}: HighlightColorPickerProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [selectedColor, setSelectedColor] = useState<HighlightColor | null>(null);
  const [showNewNote, setShowNewNote] = useState(false);
  const [newNoteText, setNewNoteText] = useState('');

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onDismiss();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (showNewNote) {
          setShowNewNote(false);
          setNewNoteText('');
        } else if (selectedColor) {
          setSelectedColor(null);
        } else {
          onDismiss();
        }
      }
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onDismiss, selectedColor, showNewNote]);

  // Position above the selection, centered
  const top = rect.top + window.scrollY - 44;
  const left = rect.left + window.scrollX + rect.width / 2;

  return createPortal(
    <div
      ref={ref}
      className="fixed z-50 rounded-lg border bg-white shadow-lg"
      style={{
        top: `${top}px`,
        left: `${left}px`,
        transform: 'translate(-50%, 0)',
      }}
    >
      {!selectedColor ? (
        /* Step 1: Color selection */
        <div className="flex items-center gap-1.5 px-2 py-1.5">
          {COLORS.map(({ key, bg, label }) => (
            <button
              key={key}
              onClick={() => setSelectedColor(key)}
              title={label}
              className={`h-6 w-6 rounded-full ${bg} border border-gray-300 hover:scale-110 hover:ring-2 hover:ring-gray-400 transition-transform`}
            />
          ))}
        </div>
      ) : (
        /* Step 2: Note selection */
        <div className="w-64 p-2">
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={() => setSelectedColor(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              &larr;
            </button>
            <div
              className={`h-4 w-4 rounded-full ${COLORS.find((c) => c.key === selectedColor)?.bg} border border-gray-300`}
            />
            <span className="text-xs font-medium text-muted-foreground">Link to note</span>
          </div>

          {/* Skip — no note */}
          <button
            onClick={() => onConfirm({ color: selectedColor })}
            disabled={isCreating}
            className="w-full rounded-md px-2 py-1.5 text-left text-xs text-muted-foreground hover:bg-muted transition-colors mb-1"
          >
            Skip (no note)
          </button>

          {/* Existing notes */}
          {notes.length > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-0.5">
              {notes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => onConfirm({ color: selectedColor, noteId: note.id })}
                  disabled={isCreating}
                  className="w-full rounded-md px-2 py-1.5 text-left hover:bg-muted transition-colors flex items-center gap-1.5"
                >
                  <span className="flex-1 min-w-0 text-xs truncate">{note.content}</span>
                  <span
                    className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${PRIORITY_BADGE[note.priority] ?? ''}`}
                  >
                    {note.priority[0].toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Create new note inline */}
          {!showNewNote ? (
            <button
              onClick={() => setShowNewNote(true)}
              className="mt-1 flex w-full items-center gap-1 rounded-md px-2 py-1.5 text-xs text-primary hover:bg-primary/5 transition-colors"
            >
              <Plus className="h-3 w-3" />
              Create new note
            </button>
          ) : (
            <div className="mt-1 space-y-1.5">
              <textarea
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Note content..."
                rows={2}
                maxLength={1000}
                autoFocus
                className="w-full rounded-md border border-gray-200 px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
              <div className="flex justify-end gap-1">
                <button
                  onClick={() => {
                    setShowNewNote(false);
                    setNewNoteText('');
                  }}
                  className="rounded px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const trimmed = newNoteText.trim();
                    if (trimmed) {
                      onConfirm({ color: selectedColor, newNoteContent: trimmed });
                    }
                  }}
                  disabled={!newNoteText.trim() || isCreating}
                  className="rounded bg-primary px-2 py-0.5 text-xs text-white hover:bg-primary/90 disabled:opacity-40"
                >
                  {isCreating ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Save'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>,
    document.body,
  );
}
