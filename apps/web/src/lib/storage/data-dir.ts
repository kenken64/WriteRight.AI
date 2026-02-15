import path from 'path';
import fs from 'fs';

/**
 * Returns the persistent data directory path.
 * On Railway: /app/data (volume mount)
 * Locally: ./data (relative to project root)
 *
 * Env var: DATA_DIR
 *
 * Automatically creates the directory if it doesn't exist.
 */
export function getDataDir(...subPaths: string[]): string {
  const base = process.env.DATA_DIR || './data';
  const dir = subPaths.length > 0 ? path.join(base, ...subPaths) : base;

  // Ensure directory exists
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  return dir;
}

/**
 * Returns a full file path within the data directory.
 */
export function getDataFilePath(...segments: string[]): string {
  if (segments.length === 0) throw new Error('At least one path segment required');
  const fileName = segments.pop()!;
  const dir = getDataDir(...segments);
  return path.join(dir, fileName);
}
