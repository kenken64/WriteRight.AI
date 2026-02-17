'use client';

import { useState, useCallback, useRef } from 'react';
import { Upload, X, CheckCircle, AlertCircle, Image, FileText, File as FileIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

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
  onComplete: (refs: string[]) => void;
}

interface UploadFile {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'complete' | 'error';
  error?: string;
}

export function ChunkedUploader({ assignmentId, maxImages, onComplete }: ChunkedUploaderProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (incoming: File[]) => {
      const selected = incoming.slice(0, maxImages - files.length);
      const newFiles: UploadFile[] = selected.map((file) => ({
        file,
        progress: 0,
        status: 'pending',
      }));
      setFiles((prev) => [...prev, ...newFiles]);
    },
    [files.length, maxImages],
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      addFiles(Array.from(e.target.files ?? []));
    },
    [addFiles],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(Array.from(e.dataTransfer.files));
    },
    [addFiles],
  );

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadAll = async () => {
    const supabase = createClient();
    setUploading(true);
    setFiles((prev) =>
      prev.map((f) => ({ ...f, status: 'uploading' as const, progress: 0 })),
    );

    const refs: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      const timestamp = Date.now();
      const path = `${assignmentId}/${timestamp}-${f.file.name}`;

      try {
        const { error } = await supabase.storage
          .from('submissions')
          .upload(path, f.file);

        if (error) throw error;

        refs.push(path);
        setFiles((prev) =>
          prev.map((item, idx) =>
            idx === i ? { ...item, progress: 100, status: 'complete' as const } : item,
          ),
        );
      } catch (err) {
        setFiles((prev) =>
          prev.map((item, idx) =>
            idx === i
              ? { ...item, progress: 0, status: 'error' as const, error: (err as Error).message }
              : item,
          ),
        );
      }
    }

    setUploading(false);

    if (refs.length > 0) {
      onComplete(refs);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => setIsDragging(true)}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-300'}`}
      >
        <Upload className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-2 text-sm text-muted-foreground">
          Drag and drop files or click to browse
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Images (JPEG, PNG, HEIF), PDF, or Word (.docx) · Max {maxImages} files
        </p>
        <span className="mt-3 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-white">
          Browse Files
        </span>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((f, i) => (
            <div key={i} className="flex items-center gap-3 rounded-md border p-3">
              {getFileTypeIcon(f.file)}
              <div className="flex-1">
                <p className="text-sm font-medium">{f.file.name}</p>
                {f.status === 'error' && (
                  <p className="text-xs text-red-500">{f.error}</p>
                )}
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
            disabled={uploading}
            className="w-full rounded-md bg-primary py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : `Upload ${files.length} file${files.length > 1 ? 's' : ''}`}
          </button>
        </div>
      )}
    </div>
  );
}
