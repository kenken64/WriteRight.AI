'use client';

import { useEffect, useRef, useCallback } from 'react';
import { OcrTextDisplay } from './ocr-text-display';
import type { StudentHighlight, HighlightColor } from '@/lib/api/client';

const COLOR_MAP: Record<HighlightColor, string> = {
  yellow: 'rgba(254, 240, 138, 0.7)',
  green: 'rgba(187, 247, 208, 0.7)',
  blue: 'rgba(191, 219, 254, 0.7)',
  pink: 'rgba(251, 207, 232, 0.7)',
  orange: 'rgba(254, 215, 170, 0.7)',
};

export interface TextSelection {
  text: string;
  occurrenceIndex: number;
  rect: DOMRect;
}

interface HighlightableTextProps {
  text: string;
  highlights: StudentHighlight[];
  onTextSelected?: (selection: TextSelection) => void;
}

/** Collect all text nodes under a root element in document order. */
function getTextNodes(root: Node): Text[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Text | null;
  while ((node = walker.nextNode() as Text | null)) {
    nodes.push(node);
  }
  return nodes;
}

/** Get the full text content by joining all text nodes. */
function getFullText(root: Node): string {
  return getTextNodes(root).map((n) => n.nodeValue ?? '').join('');
}

/** Find the absolute character offset for the Nth occurrence of `needle` in `haystack`. */
function findNthOccurrence(haystack: string, needle: string, n: number): number {
  let idx = -1;
  for (let i = 0; i <= n; i++) {
    idx = haystack.indexOf(needle, idx + 1);
    if (idx === -1) return -1;
  }
  return idx;
}

/** Count how many times `needle` appears in `haystack` before position `beforePos`. */
function countOccurrencesBefore(haystack: string, needle: string, beforePos: number): number {
  let count = 0;
  let idx = 0;
  while (true) {
    idx = haystack.indexOf(needle, idx);
    if (idx === -1 || idx >= beforePos) break;
    count++;
    idx += 1;
  }
  return count;
}

/** Get absolute offset of a text node within the container. */
function getAbsoluteOffset(container: Node, targetNode: Text): number {
  const nodes = getTextNodes(container);
  let offset = 0;
  for (const n of nodes) {
    if (n === targetNode) return offset;
    offset += (n.nodeValue ?? '').length;
  }
  return -1;
}

/**
 * Apply highlights one at a time, re-walking the DOM after each.
 * This handles DOM mutations correctly since wrapping a text node in <mark>
 * changes the tree structure.
 */
function applyHighlights(container: HTMLElement, highlights: StudentHighlight[]) {
  // Remove existing marks
  container.querySelectorAll('mark[data-highlight]').forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
  });
  container.normalize();

  if (highlights.length === 0) return;

  for (const h of highlights) {
    const fullText = getFullText(container);
    const absStart = findNthOccurrence(fullText, h.highlighted_text, h.occurrence_index);
    if (absStart === -1) continue;
    const absEnd = absStart + h.highlighted_text.length;

    const textNodes = getTextNodes(container);
    let runningOffset = 0;

    for (const textNode of textNodes) {
      const nodeLen = (textNode.nodeValue ?? '').length;
      const nodeStart = runningOffset;
      const nodeEnd = runningOffset + nodeLen;
      runningOffset = nodeEnd;

      if (nodeEnd <= absStart || nodeStart >= absEnd) continue;

      const localStart = Math.max(0, absStart - nodeStart);
      const localEnd = Math.min(nodeLen, absEnd - nodeStart);

      const domRange = document.createRange();
      domRange.setStart(textNode, localStart);
      domRange.setEnd(textNode, localEnd);

      const mark = document.createElement('mark');
      mark.setAttribute('data-highlight', 'true');
      mark.style.backgroundColor = COLOR_MAP[h.color];
      mark.style.borderRadius = '2px';
      mark.style.padding = '0 1px';

      try {
        domRange.surroundContents(mark);
      } catch {
        const fragment = domRange.extractContents();
        mark.appendChild(fragment);
        domRange.insertNode(mark);
      }

      // Re-walk DOM from scratch for the next highlight
      break;
    }
  }
}

export function HighlightableText({ text, highlights, onTextSelected }: HighlightableTextProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Apply highlights whenever they change
  useEffect(() => {
    if (!containerRef.current) return;
    // Small delay to ensure ReactMarkdown has rendered
    const timer = setTimeout(() => {
      if (containerRef.current) {
        applyHighlights(containerRef.current, highlights);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [highlights, text]);

  const handleMouseUp = useCallback(() => {
    if (!onTextSelected || !containerRef.current) return;

    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) return;

    const selectedText = sel.toString().trim();
    if (selectedText.length < 3) return;

    // Make sure selection is within our container
    const range = sel.getRangeAt(0);
    if (!containerRef.current.contains(range.commonAncestorContainer)) return;

    // Calculate the absolute offset of the selection start within our container
    const fullText = getFullText(containerRef.current);

    // Find the start text node and its offset
    let startNode = range.startContainer;
    if (startNode.nodeType !== Node.TEXT_NODE) {
      const textNodes = getTextNodes(startNode as HTMLElement);
      if (textNodes.length === 0) return;
      startNode = textNodes[0];
    }

    const absOffset = getAbsoluteOffset(containerRef.current, startNode as Text);
    if (absOffset === -1) return;

    const selectionAbsStart = absOffset + range.startOffset;

    // Count occurrences of selected text before this position
    const occurrenceIndex = countOccurrencesBefore(fullText, selectedText, selectionAbsStart);

    const rect = range.getBoundingClientRect();
    sel.removeAllRanges();

    onTextSelected({ text: selectedText, occurrenceIndex, rect });
  }, [onTextSelected]);

  return (
    <div ref={containerRef} onMouseUp={handleMouseUp}>
      <OcrTextDisplay text={text} />
    </div>
  );
}
