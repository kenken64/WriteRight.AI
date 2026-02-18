import { chatCompletion } from "../shared/openai-client";
import { RewriteError, withRetry } from "../shared/errors";
import { getPrompt } from "../prompts/registry";
import { computeDiff } from "./diff";
import { calculateTargetBand } from "./band-target";
import type { RewriteResult, EvaluationResult } from "../shared/types";

export interface RewriteInput {
  essayText: string;
  mode: "exam_optimised" | "clarity_optimised";
  evaluation: EvaluationResult;
  essayType: "situational" | "continuous";
  prompt: string;
  targetBand?: number;
}

export async function rewriteEssay(input: RewriteInput): Promise<RewriteResult> {
  const currentBand = input.evaluation.band;
  const targetBand = input.targetBand && input.targetBand > currentBand && input.targetBand <= 5
    ? input.targetBand
    : calculateTargetBand(currentBand);

  const { system, user } = getPrompt("rewrite-v1", {
    essayText: input.essayText,
    mode: input.mode,
    essayType: input.essayType,
    prompt: input.prompt,
    currentBand: String(input.evaluation.band),
    targetBand: String(targetBand),
    weaknesses: JSON.stringify(input.evaluation.weaknesses),
    nextSteps: JSON.stringify(input.evaluation.nextSteps),
  });

  const rawResult = await withRetry(
    () => chatCompletion(system, user, { temperature: 0.4, maxTokens: 4000, jsonMode: true, tracking: { operation: "rewrite" } }),
    2
  );

  let parsed: any;
  try {
    parsed = JSON.parse(rawResult);
  } catch {
    throw new RewriteError("Failed to parse rewrite response");
  }

  const rewrittenText = parsed.rewrittenText ?? "";
  const diffPayload = computeDiff(input.essayText, rewrittenText);
  const paragraphAnnotations = Array.isArray(parsed.paragraphAnnotations)
    ? parsed.paragraphAnnotations.map((a: any) => ({
        paragraphIndex: a.paragraphIndex ?? 0,
        originalSnippet: a.originalSnippet ?? "",
        feedback: a.feedback ?? "",
        dimension: a.dimension ?? "",
      }))
    : [];

  return {
    mode: input.mode,
    rewrittenText,
    diffPayload,
    rationale: parsed.rationale ?? {},
    bandJustification: parsed.bandJustification ?? null,
    paragraphAnnotations,
    targetBand,
  };
}
