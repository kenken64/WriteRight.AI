// Import from lib path to avoid pdf-parse index.js which tries to read a test file at import time
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse: (buffer: Buffer) => Promise<{ numpages: number; text: string }> = require("pdf-parse/lib/pdf-parse");
import { visionCompletion } from "../shared/openai-client";
import { MODEL_VISION } from "../shared/model-config";
import { OCRError } from "../shared/errors";
import { calculateConfidence } from "./confidence";
import type { OcrResult, OcrPage } from "../shared/types";

const MIN_TEXT_LENGTH = 50;

const OCR_SYSTEM_PROMPT = `You are an OCR engine specialised in reading handwritten English essays by Singaporean secondary school students.
Extract ALL text exactly as written, preserving:
- Paragraph breaks
- Crossed-out words (mark as [crossed out: word])
- Illegible words (mark as [illegible])
- Spelling errors (preserve them, do not correct)
Output the raw transcription only, no commentary.`;

/**
 * Extract text from a PDF file.
 * For digital PDFs with selectable text, extracts directly.
 * For scanned/handwritten PDFs, falls back to OpenAI vision OCR.
 */
export async function extractTextFromPdf(fileUrl: string): Promise<OcrResult> {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new OCRError(`Failed to download PDF: ${response.statusText}`, fileUrl);
  }
  const buffer = Buffer.from(await response.arrayBuffer());

  let pdfData;
  try {
    pdfData = await pdfParse(buffer);
  } catch (error) {
    throw new OCRError(`Failed to parse PDF: ${(error as Error).message}`, fileUrl);
  }

  const extractedText = pdfData.text?.trim() ?? "";

  // If there's enough text, treat it as a digital PDF
  if (extractedText.length >= MIN_TEXT_LENGTH) {
    const pages: OcrPage[] = [
      {
        pageNumber: 1,
        text: extractedText,
        confidence: 1.0,
        imageRef: fileUrl,
      },
    ];
    return { text: extractedText, confidence: 1.0, pages };
  }

  // Scanned/handwritten PDF — send to OpenAI vision for OCR
  // Convert buffer to base64 data URL so visionCompletion sends it as "file" type (not "image_url")
  const pdfBase64 = `data:application/pdf;base64,${buffer.toString("base64")}`;
  try {
    const text = await visionCompletion(
      OCR_SYSTEM_PROMPT,
      [pdfBase64],
      `This is a scanned PDF with ${pdfData.numpages} page(s). Transcribe all handwritten text from every page. Output only the text.`,
      { model: MODEL_VISION, maxTokens: 4000 },
    );

    const confidence = calculateConfidence(text);
    const pages: OcrPage[] = [
      {
        pageNumber: 1,
        text,
        confidence,
        imageRef: fileUrl,
      },
    ];

    return { text, confidence, pages };
  } catch (error) {
    throw new OCRError(
      `Failed to OCR scanned PDF: ${(error as Error).message}`,
      fileUrl,
    );
  }
}
