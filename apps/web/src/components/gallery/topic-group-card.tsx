'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { GallerySubmissionCard } from './gallery-submission-card';
import type { GallerySubmission } from '@/lib/api/client';

interface TopicGroupCardProps {
  title: string;
  category: string | null;
  submissions: GallerySubmission[];
  defaultOpen?: boolean;
  showStudentName?: boolean;
}

const categoryColors: Record<string, string> = {
  environment: 'bg-green-100 text-green-700',
  technology: 'bg-blue-100 text-blue-700',
  social_issues: 'bg-purple-100 text-purple-700',
  education: 'bg-yellow-100 text-yellow-700',
  health: 'bg-red-100 text-red-700',
  current_affairs: 'bg-orange-100 text-orange-700',
};

function formatCategory(cat: string): string {
  return cat.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function TopicGroupCard({
  title,
  category,
  submissions,
  defaultOpen = false,
  showStudentName,
}: TopicGroupCardProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border bg-white">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/50"
      >
        {open ? (
          <ChevronDown className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold leading-snug">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {category && (
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                categoryColors[category] ?? 'bg-gray-100 text-gray-700'
              }`}
            >
              {formatCategory(category)}
            </span>
          )}
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {submissions.length} {submissions.length === 1 ? 'essay' : 'essays'}
          </span>
        </div>
      </button>
      {open && (
        <div className="space-y-3 border-t px-4 py-3">
          {submissions.map((sub) => (
            <GallerySubmissionCard
              key={sub.id}
              submission={sub}
              showStudentName={showStudentName}
            />
          ))}
        </div>
      )}
    </div>
  );
}
