'use client';

import { useState, useCallback } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Image, FileText, File as FileIcon } from 'lucide-react';

const ACCEPTED_TYPES =
  'image/jpeg,image/png,image/heif,image/heic,application/pdf,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function getFileTypeIcon(file: File) {
  if (file.type === 'application/pdf') return <FileText className="h-5 w-5 text-red-500" />;
  if (
    file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.name.endsWith('.docx')
  )
    return <FileIcon className="h-5 w-5 text-blue-500" />;
  return <Image className="h-5 w-5 text-green-500" />;
}

interface ChunkedUploaderProps {
  assignmentId: string;
  maxImages: number;
  onComplete: (files: File[]) => void;
}

interface UploadFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

export function ChunkedUploader({ assignmentId, maxImages, onComplete }: ChunkedUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = Array.from(e.target.files ?? []).slice(0, maxImages - files.length);
      const newFiles: UploadFile[] = selected.map((file) => ({
        file,
        progress: 0,
        status: 'pending',
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    },
    [files.length, maxImages],
  );

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAll = async () => {
    // TODO: Implement tus.io chunked upload
    // Each file uploads with resume capability
    setFiles((prev) =>
      prev.map((f) => ({ ...f, status: 'uploading' as const, progress: 0 })),
    );

    // Simulate upload progress
    for (let i = 0; i < files.length; i++) {
      setFiles((prev) =>
        prev.map((f, idx) =>
          idx === i ? { ...f, progress: 100, status: 'complete' as const } : f,
        ),
      );
    }

    onComplete(files.map((f) => f.file));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border-2 border-dashed p-8 text-center">
        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Drag and drop files or click to browse
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Images (JPEG, PNG, HEIF), PDF, or Word (.docx) · Max {maxImages} files
        </p>
        <input
          type="file"
          accept={ACCEPTED_TYPES}
          multiple
          onChange={handleFileSelect}
          className="mt-4"
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 rounded-md border p-3">
              {getFileTypeIcon(f.file)}
              <div className="flex-1">
                <p className="text-sm font-medium">{f.file.name}</p>
                <div className="mt-1 h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${f.progress}%` }}
                  />
                </div>
              </div>
              {f.status === 'complete' && <CheckCircle className="h-5 w-5 text-green-500" />}
              {f.status === 'error' && <AlertCircle className="h-5 w-5 text-red-500" />}
              {f.status === 'pending' && (
                <button onClick={() => removeFile(i)}>
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={uploadAll}
            className="w-full rounded-md bg-primary py-2 text-sm font-medium text-white hover:bg-primary/90"
          >
            Upload {files.length} file{files.length > 1 ? 's' : ''}
          </button>
        </div>
      )}
    </div>
  );
}
