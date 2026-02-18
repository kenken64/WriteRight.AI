'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { readCsrfToken } from './use-csrf-token';

type TtsStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';

interface UseTtsReturn {
  status: TtsStatus;
  progress: number; // 0-1
  error: string | null;
  play: (text: string, useCase?: 'feedback' | 'rewrite' | 'vocabulary') => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

const MAX_CHUNK_LENGTH = 4000; // Leave some room below the 4096 API limit

/** Split text at sentence boundaries into chunks under the max length. */
function chunkText(text: string): string[] {
  if (text.length <= MAX_CHUNK_LENGTH) return [text];

  const sentences = text.match(/[^.!?]+[.!?]+\s*/g) ?? [text];
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if ((current + sentence).length > MAX_CHUNK_LENGTH) {
      if (current) chunks.push(current.trim());
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks;
}

interface AudioChunk {
  buffer: ArrayBuffer;
  contentType: string;
}

async function fetchAudioChunk(
  text: string,
  useCase?: string,
): Promise<AudioChunk> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const csrfToken = readCsrfToken();
  if (csrfToken) headers['x-csrf-token'] = csrfToken;

  const res = await fetch('/api/v1/tts', {
    method: 'POST',
    headers,
    body: JSON.stringify({ text, useCase }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'TTS request failed' }));
    throw new Error(err.error || `TTS error: ${res.status}`);
  }

  const contentType = res.headers.get('content-type') || 'audio/mpeg';

  // Guard: make sure we actually got audio back, not HTML/JSON
  if (!contentType.startsWith('audio/')) {
    const body = await res.text();
    throw new Error(`Expected audio response but got ${contentType}: ${body.slice(0, 200)}`);
  }

  return { buffer: await res.arrayBuffer(), contentType };
}

export function useTts(): UseTtsReturn {
  const [status, setStatus] = useState<TtsStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Clean up object URL and audio element
  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute('src');
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
      abortRef.current?.abort();
    };
  }, [cleanup]);

  const play = useCallback(
    async (text: string, useCase?: 'feedback' | 'rewrite' | 'vocabulary') => {
      // Abort any in-flight request
      abortRef.current?.abort();
      cleanup();

      const controller = new AbortController();
      abortRef.current = controller;

      setStatus('loading');
      setProgress(0);
      setError(null);

      try {
        const chunks = chunkText(text);
        const audioChunks: AudioChunk[] = [];

        for (let i = 0; i < chunks.length; i++) {
          if (controller.signal.aborted) return;
          audioChunks.push(await fetchAudioChunk(chunks[i], useCase));
          setProgress((i + 1) / chunks.length * 0.5); // First 50% = loading
        }

        if (controller.signal.aborted) return;

        // Use the content type from the first chunk response
        const mimeType = audioChunks[0]?.contentType ?? 'audio/mpeg';
        const blob = new Blob(
          audioChunks.map((c) => c.buffer),
          { type: mimeType },
        );
        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;

        const audio = new Audio();
        audioRef.current = audio;

        // Wait for the audio to be loadable before playing
        await new Promise<void>((resolve, reject) => {
          audio.addEventListener('canplaythrough', () => resolve(), { once: true });
          audio.addEventListener('error', () => {
            const code = audio.error?.code;
            const msg = audio.error?.message || 'Unknown playback error';
            reject(new Error(`Audio load failed (code ${code}): ${msg}`));
          }, { once: true });
          audio.src = url;
          audio.load();
        });

        if (controller.signal.aborted) return;

        audio.addEventListener('timeupdate', () => {
          if (audio.duration > 0) {
            setProgress(0.5 + (audio.currentTime / audio.duration) * 0.5);
          }
        });

        audio.addEventListener('ended', () => {
          setStatus('idle');
          setProgress(0);
        });

        await audio.play();
        setStatus('playing');
      } catch (err: any) {
        if (controller.signal.aborted) return;
        setStatus('error');
        setError(err.message ?? 'Failed to generate audio');
      }
    },
    [cleanup],
  );

  const pause = useCallback(() => {
    if (audioRef.current && status === 'playing') {
      audioRef.current.pause();
      setStatus('paused');
    }
  }, [status]);

  const resume = useCallback(() => {
    if (audioRef.current && status === 'paused') {
      audioRef.current.play();
      setStatus('playing');
    }
  }, [status]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    cleanup();
    setStatus('idle');
    setProgress(0);
    setError(null);
  }, [cleanup]);

  return { status, progress, error, play, pause, resume, stop };
}
