'use client';

import { useState, useCallback } from 'react';
import { OcrSection } from './ocr-section';
import { HighlightColorPicker } from './highlight-color-picker';
import {
  useStudentHighlights,
  useCreateHighlight,
  type HighlightColor,
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
  const createHighlight = useCreateHighlight();
  const [pickerState, setPickerState] = useState<TextSelection | null>(null);

  const handleTextSelected = useCallback((selection: TextSelection) => {
    setPickerState(selection);
  }, []);

  const handleColorPick = useCallback(
    (color: HighlightColor) => {
      if (!pickerState) return;
      createHighlight.mutate({
        submissionId,
        highlighted_text: pickerState.text,
        color,
        occurrence_index: pickerState.occurrenceIndex,
      });
      setPickerState(null);
    },
    [pickerState, submissionId, createHighlight],
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
          onPick={handleColorPick}
          onDismiss={handleDismiss}
        />
      )}
    </>
  );
}
