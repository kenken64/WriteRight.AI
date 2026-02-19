'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useGallery, type GallerySubmission } from '@/lib/api/client';
import { TopicGroupCard } from '@/components/gallery/topic-group-card';
import { Pagination } from '@/components/ui/pagination';
import { DEFAULT_PAGE_SIZE, computeTotalPages } from '@/lib/utils/pagination';
import { createClient } from '@/lib/supabase/client';

const categoryFilters = [
  { label: 'All', value: '' },
  { label: 'Environment', value: 'environment' },
  { label: 'Technology', value: 'technology' },
  { label: 'Social Issues', value: 'social_issues' },
  { label: 'Education', value: 'education' },
  { label: 'Health', value: 'health' },
  { label: 'Current Affairs', value: 'current_affairs' },
];

interface TopicGroup {
  topicId: string;
  title: string;
  category: string | null;
  submissions: GallerySubmission[];
}

function groupByTopic(submissions: GallerySubmission[]): TopicGroup[] {
  const groups = new Map<string, TopicGroup>();

  for (const sub of submissions) {
    const topic = sub.assignment?.topic;
    const topicId = topic?.id ?? '__uncategorized';
    const existing = groups.get(topicId);

    if (existing) {
      existing.submissions.push(sub);
    } else {
      let title = 'Uncategorized';
      if (topic) {
        // Use first generated prompt as title, or source_text
        const prompts = topic.generated_prompts as { prompts?: string[] } | null;
        if (prompts?.prompts?.[0]) {
          title = prompts.prompts[0];
        } else if (topic.source_text) {
          title = topic.source_text.length > 100
            ? topic.source_text.slice(0, 100) + '...'
            : topic.source_text;
        }
      }

      groups.set(topicId, {
        topicId,
        title,
        category: topic?.category ?? null,
        submissions: [sub],
      });
    }
  }

  return Array.from(groups.values());
}

export default function GalleryPage() {
  const searchParams = useSearchParams();
  const category = searchParams.get('category') ?? '';
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);

  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setRole(data.user?.user_metadata?.role ?? null);
    });
  }, []);

  const filters = category ? { category } : undefined;
  const { data, isLoading } = useGallery(filters, page, DEFAULT_PAGE_SIZE);
  const submissions = data?.submissions;
  const total = data?.total ?? 0;
  const totalPages = computeTotalPages(total, DEFAULT_PAGE_SIZE);

  const groups = useMemo(
    () => (submissions ? groupByTopic(submissions) : []),
    [submissions],
  );

  const existingParams: Record<string, string> = {};
  if (category) existingParams.category = category;

  return (
    <div>
      <h1 className="text-2xl font-bold md:text-3xl">Essay Gallery</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Browse completed essays grouped by topic
      </p>

      {/* Category filter pills */}
      <div className="mt-6 flex flex-wrap gap-3">
        {categoryFilters.map((cat) => {
          const href = cat.value ? `/gallery?category=${cat.value}` : '/gallery';
          return (
            <Link
              key={cat.value}
              href={href}
              className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                category === cat.value
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              {cat.label}
            </Link>
          );
        })}
      </div>

      {isLoading && (
        <div className="mt-8 text-center text-sm text-muted-foreground">
          Loading essays...
        </div>
      )}

      {!isLoading && groups.length === 0 && (
        <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border bg-white py-20 px-6 text-center">
          <span className="text-6xl">📝</span>
          <h3 className="mt-6 text-xl font-bold text-gray-900">No essays found</h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Completed essays will appear here grouped by topic. Submit an essay to get started.
          </p>
          <Link
            href="/assignments"
            className="mt-6 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            Go to assignments
          </Link>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {groups.map((group, idx) => (
          <TopicGroupCard
            key={group.topicId}
            title={group.title}
            category={group.category}
            submissions={group.submissions}
            defaultOpen={idx === 0}
            showStudentName={role === 'parent'}
          />
        ))}
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        basePath="/gallery"
        existingParams={existingParams}
      />
    </div>
  );
}
