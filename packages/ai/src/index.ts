export { extractTextFromImages, extractTextFromFiles } from "./ocr/vision-client";
export { extractTextFromPdf } from "./ocr/pdf-extractor";
export { extractTextFromWord } from "./ocr/word-extractor";
export { calculateConfidence, needsManualReview, getConfidenceLabel } from "./ocr/confidence";
export { evaluateEssay } from "./marking/engine";
export type { MarkingInput } from "./marking/engine";
export type {
  OcrResult,
  OcrPage,
  EvaluationResult,
  DimensionScore,
  FeedbackItem,
  RewriteResult,
  DiffChange,
  TopicPrompt,
  AchievementCheck,
  StreakData,
} from "./shared/types";
export { AIError, OCRError, MarkingError, RewriteError, TopicGenerationError, RateLimitError } from "./shared/errors";
