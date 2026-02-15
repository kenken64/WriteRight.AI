/**
 * Strip all HTML tags from input text to prevent XSS.
 */
export function sanitizeInput(text: string): string {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '') // Strip HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: URIs
    .replace(/on\w+\s*=/gi, '') // Remove event handlers like onclick=
    .replace(/&lt;script/gi, '&lt;script') // Prevent encoded script tags
    .trim();
}

/**
 * Allow only safe Tiptap HTML tags for essay content.
 * Strips everything except: p, strong, em, u, br, ul, ol, li
 */
export function sanitizeEssayContent(html: string): string {
  if (!html) return '';

  const ALLOWED_TAGS = new Set(['p', 'strong', 'em', 'u', 'br', 'ul', 'ol', 'li']);

  // Remove all attributes from all tags first
  let cleaned = html.replace(/<(\w+)(\s[^>]*)?\/?>/g, (match, tag: string, attrs: string) => {
    const tagLower = tag.toLowerCase();
    if (!ALLOWED_TAGS.has(tagLower)) return ''; // Strip disallowed tags
    // Self-closing tags like <br />
    if (match.endsWith('/>')) return `<${tagLower} />`;
    return `<${tagLower}>`;
  });

  // Remove closing tags for disallowed elements
  cleaned = cleaned.replace(/<\/(\w+)>/g, (match, tag: string) => {
    return ALLOWED_TAGS.has(tag.toLowerCase()) ? `</${tag.toLowerCase()}>` : '';
  });

  // Remove javascript: URIs and event handlers that might survive
  cleaned = cleaned.replace(/javascript:/gi, '');
  cleaned = cleaned.replace(/on\w+\s*=/gi, '');

  return cleaned.trim();
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/heif',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
]);

/**
 * Validate file MIME type against allowed types.
 */
export function validateFileType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.has(mimeType.toLowerCase());
}
