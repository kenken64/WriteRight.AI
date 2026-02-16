'use client';

import { useState } from 'react';
import { OcrTextDisplay } from './ocr-text-display';

interface OcrSectionProps {
  text: string;
  imageUrls: string[];
}

const tabs = ['Text', 'Original'] as const;
type Tab = (typeof tabs)[number];

export function OcrSection({ text, imageUrls }: OcrSectionProps) {
  const [active, setActive] = useState<Tab>('Text');

  const hasImages = imageUrls.length > 0;

  return (
    <div className="mt-4">
      {/* Tab bar */}
      {hasImages && (
        <div className="flex gap-1 border-b mb-4">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActive(tab)}
              className={`px-4 py-2 text-sm font-medium transition-colors -mb-px ${
                active === tab
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Tab content */}
      {active === 'Text' && <OcrTextDisplay text={text} />}

      {active === 'Original' && hasImages && (
        <div className="flex flex-col gap-4">
          {imageUrls.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`Original handwritten page ${i + 1}`}
              className="w-full rounded-md border object-contain"
            />
          ))}
        </div>
      )}
    </div>
  );
}
