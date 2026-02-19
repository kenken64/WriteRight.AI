import { visionCompletion } from "../shared/openai-client";
import { MODEL_VISION } from "../shared/model-config";
import { OCRError } from "../shared/errors";
import { calculateConfidence } from "./confidence";
import type { OcrResult, OcrPage } from "../shared/types";

const OCR_SYSTEM_PROMPT = `You are an OCR engine specialised in reading handwritten English essays by Singaporean secondary school students.
Convert the handwritten text to well-formatted Markdown. Preserve the document structure including:
- Paragraph breaks (use double newlines)
- Line breaks where the student intended them
- Headings (use ## for headings)
- Addresses, dates, salutations, and closings (preserve letter formatting)
- Crossed-out words (mark as ~~crossed out: word~~)
- Illegible words (mark as **[illegible]**)
- Spelling errors (preserve them exactly, do not correct)
Output only the Markdown-formatted transcription, no commentary.`;

/**
 * Extract text from a PDF file.
 * Converts each page to a PNG image, then sends each to OpenAI vision for OCR.
 */
export async function extractTextFromPdf(fileUrl: string): Promise<OcrResult> {
  // Step 1: Download the PDF
  const response = await fetch(fileUrl);
  if (!response.ok) {
    throw new OCRError(`Failed to download PDF: ${response.statusText}`, fileUrl);
  }
  const buffer = Buffer.from(await response.arrayBuffer());

  // Step 2: Convert each PDF page to a PNG image
  // Pass as data URL string to avoid path.dirname() issue in bundled Next.js
  const pdfDataUrl = `data:application/pdf;base64,${buffer.toString("base64")}`;
  const { pdf } = await import("pdf-to-img");
  let pageImages: Buffer[];
  try {
    const document = await pdf(pdfDataUrl, { scale: 2.0 });
    pageImages = [];
    for await (const image of document) {
      pageImages.push(image);
    }
  } catch (error) {
    throw new OCRError(`Failed to convert PDF to images: ${(error as Error).message}`, fileUrl);
  }

  if (!pageImages.length) {
    throw new OCRError("PDF produced no pages", fileUrl);
  }

  console.log(`[pdf-extractor] Converted PDF to ${pageImages.length} page image(s)`);

  // Step 3: OCR each page image via OpenAI vision
  const pages: OcrPage[] = [];

  for (let i = 0; i < pageImages.length; i++) {
    const pageNum = i + 1;
    const imageBase64 = `data:image/png;base64,${pageImages[i].toString("base64")}`;

    try {
      const text = await visionCompletion(
        OCR_SYSTEM_PROMPT,
        [imageBase64],
        `Transcribe page ${pageNum} of the handwritten essay. Convert to well-formatted Markdown.`,
        { model: MODEL_VISION, maxTokens: 4000, tracking: { operation: "ocr" } },
      );

      const confidence = calculateConfidence(text);
      pages.push({ pageNumber: pageNum, text, confidence, imageRef: fileUrl });
      console.log(`[pdf-extractor] Page ${pageNum} OCR complete — ${text.length} chars, confidence: ${confidence.toFixed(2)}`);
    } catch (error) {
      throw new OCRError(
        `Failed to OCR page ${pageNum}: ${(error as Error).message}`,
        fileUrl,
      );
    }
  }

  // Step 4: Combine results
  const fullText = pages.map((p) => p.text).join("\n\n");
  const avgConfidence = pages.reduce((sum, p) => sum + p.confidence, 0) / pages.length;

  return { text: fullText, confidence: avgConfidence, pages };
}
