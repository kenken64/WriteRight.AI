'use client';

import ReactMarkdown from 'react-markdown';

interface OcrTextDisplayProps {
  text: string;
}

export function OcrTextDisplay({ text }: OcrTextDisplayProps) {
  return (
    <div className="mt-4 prose prose-sm max-w-none">
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  );
}
