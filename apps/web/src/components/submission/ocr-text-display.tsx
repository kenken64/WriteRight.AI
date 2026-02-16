'use client';

import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';

interface OcrTextDisplayProps {
  text: string;
}

export function OcrTextDisplay({ text }: OcrTextDisplayProps) {
  return (
    <div className="mt-4 prose prose-sm max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{text}</ReactMarkdown>
    </div>
  );
}
