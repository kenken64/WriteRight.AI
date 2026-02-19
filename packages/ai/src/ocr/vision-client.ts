import { visionCompletion } from "../shared/openai-client";
import { MODEL_VISION } from "../shared/model-config";
import { OCRError } from "../shared/errors";
import type { OcrResult, OcrPage } from "../shared/types";
import { calculateConfidence } from "./confidence";
import { extractTextFromPdf } from "./pdf-extractor";
import { extractTextFromWord } from "./word-extractor";

const OCR_SYSTEM_PROMPT = `You are an OCR engine specialised in reading handwritten English essays by Singaporean secondary school students.
Convert the handwritten text to well-formatted Markdown. Preserve the document structure including:
- Paragraph breaks (use double newlines)
- Line breaks where the student intended them
- Indentation (use blockquotes if needed)
- Headings (use ## for headings)
- Addresses, dates, salutations, and closings (preserve letter formatting)
- Lists (use - or 1. as appropriate)
- Crossed-out words (mark as ~~crossed out: word~~)
- Illegible words (mark as **[illegible]**)
- Spelling errors (preserve them exactly, do not correct)
Use appropriate Markdown syntax. Output only the Markdown-formatted transcription, no commentary.`;

/**
 * Download a remote image and return it as a base64 data URL.
 * This avoids OpenAI's server-side download which can timeout on signed URLs.
 */
async function toBase64DataUrl(imageUrl: string): Promise<string> {
  // Already a data URL — pass through
  if (imageUrl.startsWith("data:")) return imageUrl;

  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
  }
  const contentType = response.headers.get("content-type") || "image/jpeg";
  const buffer = Buffer.from(await response.arrayBuffer());
  return `data:${contentType};base64,${buffer.toString("base64")}`;
}

export async function extractTextFromImages(imageUrls: string[]): Promise<OcrResult> {
  const pages: OcrPage[] = [];

  for (let i = 0; i < imageUrls.length; i++) {
    try {
      // Download image and convert to base64 to avoid OpenAI URL-fetch timeouts
      const dataUrl = await toBase64DataUrl(imageUrls[i]);

      const text = await visionCompletion(
        OCR_SYSTEM_PROMPT,
        [dataUrl],
        `Transcribe page ${i + 1} of the handwritten essay. Convert to well-formatted Markdown.`,
        { model: MODEL_VISION, maxTokens: 3000, tracking: { operation: "ocr" } }
      );

      const confidence = calculateConfidence(text);
      pages.push({ pageNumber: i + 1, text, confidence, imageRef: imageUrls[i] });
    } catch (error) {
      throw new OCRError(`Failed to process page ${i + 1}: ${(error as Error).message}`, imageUrls[i]);
    }
  }

  const fullText = pages.map((p) => p.text).join("\n\n");
  const avgConfidence = pages.reduce((sum, p) => sum + p.confidence, 0) / pages.length;

  return { text: fullText, confidence: avgConfidence, pages };
}

const WORD_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
]);

/**
 * Unified entry point: routes to the appropriate extractor based on file type.
 */
export async function extractTextFromFiles(
  fileUrls: string[],
  fileType: string,
): Promise<OcrResult> {
  if (fileType === "application/pdf") {
    // PDFs are processed individually then merged
    const allPages: OcrPage[] = [];
    for (const url of fileUrls) {
      const result = await extractTextFromPdf(url);
      allPages.push(...result.pages);
    }
    const fullText = allPages.map((p) => p.text).join("\n\n");
    const avgConfidence =
      allPages.reduce((sum, p) => sum + p.confidence, 0) / allPages.length;
    return { text: fullText, confidence: avgConfidence, pages: allPages };
  }

  if (WORD_MIME_TYPES.has(fileType)) {
    // Word docs are processed individually then merged
    const allPages: OcrPage[] = [];
    for (const url of fileUrls) {
      const result = await extractTextFromWord(url);
      allPages.push(...result.pages);
    }
    const fullText = allPages.map((p) => p.text).join("\n\n");
    const avgConfidence =
      allPages.reduce((sum, p) => sum + p.confidence, 0) / allPages.length;
    return { text: fullText, confidence: avgConfidence, pages: allPages };
  }

  // Default: treat as images
  return extractTextFromImages(fileUrls);
}
