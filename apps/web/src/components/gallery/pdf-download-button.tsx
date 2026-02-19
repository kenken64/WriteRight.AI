'use client';

import { useState } from 'react';
import { Download, Loader2, FileDown } from 'lucide-react';
import { useGenerateGalleryPdf } from '@/lib/api/client';

interface PdfDownloadButtonProps {
  submissionId: string;
  imageRefs: string[] | null;
  galleryPdfRef: string | null;
}

export function PdfDownloadButton({ submissionId, imageRefs, galleryPdfRef }: PdfDownloadButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const generatePdf = useGenerateGalleryPdf();

  if (!imageRefs || imageRefs.length === 0) return null;

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (galleryPdfRef) {
      // PDF already exists — fetch signed URL via GET
      setDownloading(true);
      try {
        const res = await fetch(`/api/v1/gallery/${submissionId}/pdf`);
        const data = await res.json();
        if (data.url) window.open(data.url, '_blank');
      } finally {
        setDownloading(false);
      }
    } else {
      // Generate PDF via POST
      generatePdf.mutate(submissionId, {
        onSuccess: (data) => {
          if (data.url) window.open(data.url, '_blank');
        },
      });
    }
  };

  const generating = generatePdf.isPending;
  const isLoading = generating || downloading;

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors hover:bg-muted disabled:opacity-50"
    >
      {isLoading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : galleryPdfRef ? (
        <Download className="h-3.5 w-3.5" />
      ) : (
        <FileDown className="h-3.5 w-3.5" />
      )}
      {isLoading ? 'Processing...' : galleryPdfRef ? 'Download PDF' : 'Generate PDF'}
    </button>
  );
}
