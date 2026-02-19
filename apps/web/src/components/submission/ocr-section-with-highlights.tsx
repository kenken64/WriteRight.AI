'use client';

import { useState, useCallback } from 'react';
import { OcrSection } from './ocr-section';
import { HighlightColorPicker, type HighlightConfirmPayload } from './highlight-color-picker';
import {
  useStudentHighlights,
  useStudentNotes,
  useCreateHighlight,
  useCreateNote,
} from '@/lib/api/client';
import type { TextSelection } from './highlightable-text';

interface OcrSectionWithHighlightsProps {
  submissionId: string;
  text: string;
  imageUrls: string[];
}

export function OcrSectionWithHighlights({
  submissionId,
  text,
  imageUrls,
}: OcrSectionWithHighlightsProps) {
  const { data: highlights = [] } = useStudentHighlights(submissionId);
  const { data: notes = [] } = useStudentNotes(submissionId);
  const createHighlight = useCreateHighlight();
  const createNote = useCreateNote();
  const [pickerState, setPickerState] = useState<TextSelection | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const handleTextSelected = useCallback((selection: TextSelection) => {
    setPickerState(selection);
  }, []);

  const handleConfirm = useCallback(
    async (payload: HighlightConfirmPayload) => {
      if (!pickerState) return;
      setIsCreating(true);

      try {
        let noteId: string | undefined;

        // If creating a new note first, do that
        if ('newNoteContent' in payload && payload.newNoteContent) {
          const result = await createNote.mutateAsync({
            submissionId,
            content: payload.newNoteContent,
            priority: 'medium',
          });
          noteId = result.note.id;
        } else if ('noteId' in payload && payload.noteId) {
          noteId = payload.noteId;
        }

        // Create the highlight
        await createHighlight.mutateAsync({
          submissionId,
          highlighted_text: pickerState.text,
          color: payload.color,
          occurrence_index: pickerState.occurrenceIndex,
          ...(noteId && { note_id: noteId }),
        });

        setPickerState(null);
      } finally {
        setIsCreating(false);
      }
    },
    [pickerState, submissionId, createHighlight, createNote],
  );

  const handleDismiss = useCallback(() => {
    setPickerState(null);
  }, []);

  return (
    <>
      <OcrSection
        submissionId={submissionId}
        text={text}
        imageUrls={imageUrls}
        highlights={highlights}
        onTextSelected={handleTextSelected}
        isStudentView
      />
      {pickerState && (
        <HighlightColorPicker
          rect={pickerState.rect}
          notes={notes}
          onConfirm={handleConfirm}
          onDismiss={handleDismiss}
          isCreating={isCreating}
        />
      )}
    </>
  );
}
