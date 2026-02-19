'use client';

import { useUpdateGalleryCategory } from '@/lib/api/client';

const CATEGORIES = [
  { label: 'Inherit from topic', value: '' },
  { label: 'Environment', value: 'environment' },
  { label: 'Technology', value: 'technology' },
  { label: 'Social Issues', value: 'social_issues' },
  { label: 'Education', value: 'education' },
  { label: 'Health', value: 'health' },
  { label: 'Current Affairs', value: 'current_affairs' },
];

interface CategorySelectProps {
  submissionId: string;
  currentCategory: string | null;
}

export function CategorySelect({ submissionId, currentCategory }: CategorySelectProps) {
  const { mutate, isPending } = useUpdateGalleryCategory();

  return (
    <div
      className="relative flex items-center"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <select
        value={currentCategory ?? ''}
        onChange={(e) => {
          const value = e.target.value || null;
          mutate({ submissionId, category: value });
        }}
        disabled={isPending}
        className="h-8 rounded-md border bg-white px-2 text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
      >
        {CATEGORIES.map((cat) => (
          <option key={cat.value} value={cat.value}>
            {cat.label}
          </option>
        ))}
      </select>
      {isPending && (
        <span className="absolute -right-5 h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-primary" />
      )}
    </div>
  );
}
