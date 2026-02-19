'use client';

import Link from 'next/link';
import { formatRelativeDate, formatStatus } from '@/lib/utils/format';
import { PdfDownloadButton } from './pdf-download-button';
import { CategorySelect } from './category-select';
import type { GallerySubmission } from '@/lib/api/client';

interface GallerySubmissionCardProps {
  submission: GallerySubmission;
  showStudentName?: boolean;
}

export function GallerySubmissionCard({ submission, showStudentName }: GallerySubmissionCardProps) {
  const assignment = submission.assignment;
  const prompt = assignment?.prompt ?? 'Untitled';
  const status = formatStatus(submission.status);

  return (
    <div className="flex items-start justify-between gap-3 rounded-lg border bg-white p-4 transition-shadow hover:shadow-md">
      <Link href={`/submissions/${submission.id}`} className="min-w-0 flex-1">
        <h4 className="font-medium leading-snug">
          {prompt.length > 100 ? `${prompt.slice(0, 100)}...` : prompt}
        </h4>
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {assignment?.essay_type && (
            <span className="capitalize">{assignment.essay_type.replace('_', ' ')}</span>
          )}
          <span>{formatRelativeDate(submission.created_at)}</span>
          {showStudentName && assignment?.student?.display_name && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-700">
              {assignment.student.display_name}
            </span>
          )}
          <span className={`rounded-full px-2 py-0.5 ${status.color}`}>
            {status.label}
          </span>
        </div>
      </Link>
      <div className="flex shrink-0 items-center gap-2">
        <CategorySelect
          submissionId={submission.id}
          currentCategory={submission.gallery_category}
        />
        <PdfDownloadButton
          submissionId={submission.id}
          imageRefs={submission.image_refs}
          galleryPdfRef={submission.gallery_pdf_ref}
        />
      </div>
    </div>
  );
}
