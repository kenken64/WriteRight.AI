import mammoth from "mammoth";
import { OCRError } from "../shared/errors";
import type { OcrResult, OcrPage } from "../shared/types";

/**
 * Extract text from a .docx Word document.
 * Since this is digital text, confidence is always 1.0.
 */
export async function extractTextFromWord(fileUrl: string): Promise<OcrResult> {
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new OCRError(`Failed to download Word document: ${response.statusText}`, fileUrl);
  }
  const buffer = Buffer.from(await response.arrayBuffer());

  let result;
  try {
    result = await mammoth.extractRawText({ buffer });
  } catch (error) {
    throw new OCRError(
      `Failed to extract text from Word document: ${(error as Error).message}`,
      fileUrl,
    );
  }

  const text = result.value.trim();
  if (!text) {
    throw new OCRError("Word document contains no text", fileUrl);
  }

  const pages: OcrPage[] = [
    {
      pageNumber: 1,
      text,
      confidence: 1.0,
      imageRef: fileUrl,
    },
  ];

  return { text, confidence: 1.0, pages };
}
