import { visionCompletion } from "../shared/openai-client";
import { OCRError } from "../shared/errors";
import type { OcrResult, OcrPage } from "../shared/types";
import { calculateConfidence } from "./confidence";
import { extractTextFromPdf } from "./pdf-extractor";
import { extractTextFromWord } from "./word-extractor";

const OCR_SYSTEM_PROMPT = `You are an OCR engine specialised in reading handwritten English essays by Singaporean secondary school students.
Extract ALL text exactly as written, preserving:
- Paragraph breaks
- Crossed-out words (mark as [crossed out: word])
- Illegible words (mark as [illegible])
- Spelling errors (preserve them, do not correct)
Output the raw transcription only, no commentary.`;

export async function extractTextFromImages(imageUrls: string[]): Promise<OcrResult> {
  const pages: OcrPage[] = [];

  for (let i = 0; i < imageUrls.length; i++) {
    try {
      const text = await visionCompletion(
        OCR_SYSTEM_PROMPT,
        [imageUrls[i]],
        `Transcribe page ${i + 1} of the handwritten essay. Output only the text.`,
        { maxTokens: 3000 }
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
