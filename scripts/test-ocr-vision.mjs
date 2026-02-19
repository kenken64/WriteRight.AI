#!/usr/bin/env node

/**
 * Test OCR using OpenAI Vision model on a local PDF/image file.
 * Zero dependencies — uses native fetch API only.
 *
 * Usage:
 *   node scripts/test-ocr-vision.mjs <file-path>
 *
 * Example:
 *   node scripts/test-ocr-vision.mjs ~/Downloads/Global_Perspectives_Day_Speech.pdf
 */

import fs from "node:fs";
import path from "node:path";

// ── Load env from .env.local files ─────────────────────────────────
const scriptDir = new URL(".", import.meta.url).pathname;
const envPaths = [
  path.resolve(scriptDir, "../apps/web/.env.local"),
  path.resolve(scriptDir, "../.env.local"),
];

for (const p of envPaths) {
  if (fs.existsSync(p)) {
    const lines = fs.readFileSync(p, "utf-8").split("\n");
    for (const line of lines) {
      const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (match && !process.env[match[1]]) {
        process.env[match[1]] = match[2].trim();
      }
    }
  }
}

if (!process.env.OPENAI_API_KEY) {
  console.error("Error: OPENAI_API_KEY not found in environment or .env.local");
  process.exit(1);
}

// ── Config ─────────────────────────────────────────────────────────
const API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL_VISION ?? "gpt-4o";
const API_URL = "https://api.openai.com/v1/chat/completions";

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

// ── Helpers ────────────────────────────────────────────────────────
const MIME_MAP = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  tiff: "image/tiff",
};

function readFileAsBase64(filePath) {
  const absPath = path.resolve(filePath);
  if (!fs.existsSync(absPath)) {
    console.error(`File not found: ${absPath}`);
    process.exit(1);
  }

  const ext = path.extname(absPath).toLowerCase().slice(1);
  const mime = MIME_MAP[ext];
  if (!mime) {
    console.error(`Unsupported file type: .${ext}`);
    console.error(`Supported: ${Object.keys(MIME_MAP).join(", ")}`);
    process.exit(1);
  }

  const data = fs.readFileSync(absPath);
  const base64 = data.toString("base64");
  return { dataUrl: `data:${mime};base64,${base64}`, mime, ext, size: data.length };
}

// ── Main ───────────────────────────────────────────────────────────
async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: node scripts/test-ocr-vision.mjs <file-path>");
    console.error("  e.g. node scripts/test-ocr-vision.mjs ~/Downloads/essay.pdf");
    process.exit(1);
  }

  console.log(`\nFile:  ${path.resolve(filePath)}`);

  const { dataUrl, mime, ext, size } = readFileAsBase64(filePath);
  console.log(`Size:  ${(size / 1024).toFixed(1)} KB`);
  console.log(`Type:  ${mime}`);
  console.log(`Model: ${MODEL}`);
  console.log(`\nSending to OpenAI Vision API...\n`);

  const isPdf = ext === "pdf";

  // Build message content based on file type
  const userContent = isPdf
    ? [
        {
          type: "file",
          file: {
            filename: path.basename(filePath),
            file_data: dataUrl,
          },
        },
        {
          type: "text",
          text: "Transcribe all handwritten text from this PDF. Convert to well-formatted Markdown.",
        },
      ]
    : [
        {
          type: "image_url",
          image_url: { url: dataUrl, detail: "high" },
        },
        {
          type: "text",
          text: "Transcribe the handwritten text from this image. Convert to well-formatted Markdown.",
        },
      ];

  const body = {
    model: MODEL,
    max_tokens: 4096,
    messages: [
      { role: "system", content: OCR_SYSTEM_PROMPT },
      { role: "user", content: userContent },
    ],
  };

  const start = Date.now();

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    const elapsed = ((Date.now() - start) / 1000).toFixed(1);

    if (!response.ok) {
      const errBody = await response.text();
      console.error(`\nAPI error (${response.status}) after ${elapsed}s:`);
      console.error(errBody);
      process.exit(1);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    const usage = data.usage;

    console.log("=".repeat(60));
    console.log("OCR RESULT:");
    console.log("=".repeat(60));
    console.log(text);
    console.log("=".repeat(60));
    console.log(`\nDone in ${elapsed}s`);
    console.log(
      `Tokens - prompt: ${usage?.prompt_tokens}, completion: ${usage?.completion_tokens}, total: ${usage?.total_tokens}`,
    );

    if (!text.trim()) {
      console.error("\nWARNING: Vision model returned empty text!");
      process.exit(1);
    }

    // Write output to file alongside the input
    const outPath = path.resolve(
      path.dirname(path.resolve(filePath)),
      `${path.basename(filePath, path.extname(filePath))}_ocr_output.md`,
    );
    fs.writeFileSync(outPath, text, "utf-8");
    console.log(`Output saved to: ${outPath}`);
  } catch (err) {
    const elapsed = ((Date.now() - start) / 1000).toFixed(1);
    console.error(`\nOCR failed after ${elapsed}s:`);
    console.error(err.message);
    process.exit(1);
  }
}

main();
