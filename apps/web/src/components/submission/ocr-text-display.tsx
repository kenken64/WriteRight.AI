'use client';

import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

interface OcrTextDisplayProps {
  text: string;
}

/**
 * Strip fenced code blocks (```...```) and un-indent indented code blocks
 * so the content inside is rendered as normal markdown.
 */
export function stripCodeBlocks(md: string): string {
  // Remove fenced code blocks (``` or ~~~), keeping the content inside
  let result = md.replace(/^(`{3,}|~{3,})[^\n]*\n([\s\S]*?)\n\1\s*$/gm, '$2');
  result = result.replace(/^(`{3,}|~{3,})[^\n]*$/gm, '');

  // Un-indent lines that start with 4+ spaces (indented code blocks)
  // Only strip the leading 4 spaces that trigger code block parsing
  result = result.replace(/^( {4})/gm, '');

  return result;
}

export function OcrTextDisplay({ text }: OcrTextDisplayProps) {
  const cleaned = stripCodeBlocks(text);

  return (
    <div className="mt-4 prose prose-sm max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
        {cleaned}
      </ReactMarkdown>
    </div>
  );
}
