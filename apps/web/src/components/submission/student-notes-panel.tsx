'use client';

import React, { useState } from 'react';
import { StickyNote, Plus, Trash2, Loader2 } from 'lucide-react';
import {
  useStudentNotes,
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
} from '@/lib/api/client';

interface StudentNotesPanelProps {
  submissionId: string;
}

const PRIORITY_CONFIG = {
  high: { label: 'High', color: 'bg-red-100 text-red-700', ring: 'ring-red-200' },
  medium: { label: 'Med', color: 'bg-amber-100 text-amber-700', ring: 'ring-amber-200' },
  low: { label: 'Low', color: 'bg-green-100 text-green-700', ring: 'ring-green-200' },
} as const;

type Priority = keyof typeof PRIORITY_CONFIG;

export function StudentNotesPanel({ submissionId }: StudentNotesPanelProps) {
  const [showForm, setShowForm] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newPriority, setNewPriority] = useState<Priority>('medium');
  const { data: notes = [], isLoading } = useStudentNotes(submissionId);
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const incompleteCount = notes.filter((n) => !n.is_done).length;

  // Sort: incomplete first, then by priority (high > medium > low)
  const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.is_done !== b.is_done) return a.is_done ? 1 : -1;
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const handleCreate = () => {
    const trimmed = newContent.trim();
    if (!trimmed || createNote.isPending) return;
    createNote.mutate(
      { submissionId, content: trimmed, priority: newPriority },
      {
        onSuccess: () => {
          setNewContent('');
          setNewPriority('medium');
          setShowForm(false);
        },
      },
    );
  };

  const handleToggleDone = (noteId: string, currentDone: boolean) => {
    updateNote.mutate({ submissionId, noteId, is_done: !currentDone });
  };

  const handleDelete = (noteId: string) => {
    deleteNote.mutate({ submissionId, noteId });
  };

  return (
    <div className="mt-6 rounded-lg border bg-white p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <StickyNote className="h-5 w-5 text-amber-500" />
          <span className="font-medium">My Notes</span>
          {notes.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {incompleteCount}/{notes.length} remaining
            </span>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-primary hover:bg-primary/5 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add
        </button>
      </div>

      {showForm && (
        <div className="mt-3 space-y-2 rounded-md border p-3">
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="What do you need to fix or remember?"
            maxLength={1000}
            rows={2}
            className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {(Object.keys(PRIORITY_CONFIG) as Priority[]).map((p) => (
                <button
                  key={p}
                  onClick={() => setNewPriority(p)}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-all ${
                    PRIORITY_CONFIG[p].color
                  } ${newPriority === p ? `ring-2 ${PRIORITY_CONFIG[p].ring}` : 'opacity-50'}`}
                >
                  {PRIORITY_CONFIG[p].label}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowForm(false);
                  setNewContent('');
                  setNewPriority('medium');
                }}
                className="rounded-md px-3 py-1 text-sm text-muted-foreground hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newContent.trim() || createNote.isPending}
                className="rounded-md bg-primary px-3 py-1 text-sm text-white hover:bg-primary/90 disabled:opacity-40 transition-colors"
              >
                {createNote.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Save'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && notes.length === 0 && !showForm && (
        <p className="mt-3 text-center text-xs text-muted-foreground">
          Add notes to track corrections you need to make.
        </p>
      )}

      {sortedNotes.length > 0 && (
        <div className="mt-3 space-y-2">
          {sortedNotes.map((note) => (
            <div
              key={note.id}
              className={`flex items-start gap-2 rounded-md border p-2 transition-opacity ${
                note.is_done ? 'opacity-50' : ''
              }`}
            >
              <input
                type="checkbox"
                checked={note.is_done}
                onChange={() => handleToggleDone(note.id, note.is_done)}
                className="mt-1 h-4 w-4 rounded border-gray-300 accent-primary cursor-pointer"
              />
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm ${note.is_done ? 'line-through text-muted-foreground' : ''}`}
                >
                  {note.content}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  PRIORITY_CONFIG[note.priority].color
                }`}
              >
                {PRIORITY_CONFIG[note.priority].label}
              </span>
              <button
                onClick={() => handleDelete(note.id)}
                className="shrink-0 rounded p-1 text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
