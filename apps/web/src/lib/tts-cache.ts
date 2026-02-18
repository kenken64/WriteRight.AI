import { createHash } from 'crypto';
import { readFile, writeFile, mkdir, stat } from 'fs/promises';
import path from 'path';

/**
 * File-based TTS audio cache.
 *
 * Stores generated audio on a persistent volume (Railway data volume)
 * so subsequent requests for the same text + voice serve instantly
 * without calling the OpenAI TTS API again.
 *
 * Set TTS_CACHE_DIR env var to the Railway volume mount path (e.g. /data/tts-cache).
 * If not set, caching is disabled and every request hits the API.
 */

const CACHE_DIR = process.env.TTS_CACHE_DIR || '';

interface CacheEntry {
  audio: Buffer;
  contentType: string;
}

/** Build a deterministic cache key from the TTS parameters. */
function cacheKey(text: string, voice: string, speed: number, useCase?: string): string {
  const raw = JSON.stringify({ text, voice, speed, useCase });
  return createHash('sha256').update(raw).digest('hex');
}

function cachePath(key: string, ext: string): string {
  // Spread into 2-char prefix subdirectory to avoid huge flat directories
  const subdir = key.slice(0, 2);
  return path.join(CACHE_DIR, subdir, `${key}.${ext}`);
}

/** Check if caching is enabled (env var set and non-empty). */
export function isCacheEnabled(): boolean {
  return CACHE_DIR.length > 0;
}

/** Try to read a cached audio file. Returns null on miss. */
export async function getCached(
  text: string,
  voice: string,
  speed: number,
  useCase?: string,
): Promise<CacheEntry | null> {
  if (!isCacheEnabled()) return null;

  const key = cacheKey(text, voice, speed, useCase);
  const mp3Path = cachePath(key, 'mp3');

  try {
    const audio = await readFile(mp3Path);
    return { audio, contentType: 'audio/mpeg' };
  } catch {
    return null;
  }
}

/** Write audio to the cache. Fire-and-forget — errors are silently ignored. */
export async function putCached(
  text: string,
  voice: string,
  speed: number,
  audio: Buffer,
  useCase?: string,
): Promise<void> {
  if (!isCacheEnabled()) return;

  const key = cacheKey(text, voice, speed, useCase);
  const filePath = cachePath(key, 'mp3');

  try {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, audio);
  } catch (err) {
    // Non-critical — just skip caching
    console.warn('[tts-cache] Failed to write cache:', (err as Error).message);
  }
}

/** Get cache stats (total files and size). Useful for monitoring. */
export async function getCacheStats(): Promise<{ enabled: boolean; dir: string }> {
  return { enabled: isCacheEnabled(), dir: CACHE_DIR };
}
