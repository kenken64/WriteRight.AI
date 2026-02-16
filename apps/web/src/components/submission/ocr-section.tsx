'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import remarkGfm from 'remark-gfm';
import { OcrTextDisplay } from './ocr-text-display';
import { readCsrfToken } from '@/lib/hooks/use-csrf-token';

interface OcrSectionProps {
  submissionId: string;
  text: string;
  imageUrls: string[];
}

const tabs = ['Text', 'Original'] as const;
type Tab = (typeof tabs)[number];

export function OcrSection({ submissionId, text, imageUrls }: OcrSectionProps) {
  const [active, setActive] = useState<Tab>('Text');
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(text);
  const [displayText, setDisplayText] = useState(text);
  const [saving, setSaving] = useState(false);

  const hasImages = imageUrls.length > 0;

  async function handleSave() {
    setSaving(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const csrfToken = readCsrfToken();
      if (csrfToken) headers['x-csrf-token'] = csrfToken;

      const res = await fetch(`/api/v1/submissions/${submissionId}/ocr-text`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ ocrText: draft }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setDisplayText(draft);
      setEditing(false);
    } catch (err) {
      console.error('Failed to save OCR text:', err);
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setDraft(displayText);
    setEditing(false);
  }

  function handleEdit() {
    setDraft(displayText);
    setEditing(true);
  }

  return (
    <div className="mt-4">
      {/* Tab bar + Edit button */}
      <div className="flex items-center gap-1 border-b mb-4">
        {hasImages &&
          tabs.map((tab) => (
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
        {active === 'Text' && !editing && (
          <button
            onClick={handleEdit}
            className="ml-auto px-3 py-1 text-sm font-medium rounded-md border hover:bg-muted transition-colors"
          >
            Edit
          </button>
        )}
        {active === 'Text' && editing && (
          <div className="ml-auto flex gap-2">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-3 py-1 text-sm font-medium rounded-md border hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1 text-sm font-medium rounded-md bg-primary text-white hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Tab content */}
      {active === 'Text' && !editing && <OcrTextDisplay text={displayText} />}

      {active === 'Text' && editing && (
        <div className="grid grid-cols-2 gap-4">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="w-full min-h-[400px] rounded-md border p-3 font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <div className="prose prose-sm max-w-none overflow-y-auto min-h-[400px] rounded-md border p-3">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{draft}</ReactMarkdown>
          </div>
        </div>
      )}

      {active === 'Original' && hasImages && (
        <div className="flex flex-col gap-4">
          {imageUrls.map((url, i) => {
            const isPdf = new URL(url, window.location.origin).pathname.toLowerCase().endsWith('.pdf');
            return isPdf ? (
              <iframe
                key={i}
                src={url}
                title={`Original handwritten page ${i + 1}`}
                className="w-full min-h-[600px] rounded-md border"
              />
            ) : (
              <img
                key={i}
                src={url}
                alt={`Original handwritten page ${i + 1}`}
                className="w-full rounded-md border object-contain"
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
