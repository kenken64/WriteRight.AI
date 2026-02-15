import { chatCompletion } from "../shared/openai-client";
import { MODEL_EVALUATION } from "../shared/model-config";
import { MarkingError, withRetry } from "../shared/errors";
import { getPrompt } from "../prompts/registry";
import { getSituationalRubric } from "./rubrics/situational";
import { getContinuousRubric } from "./rubrics/continuous";
import { validateEvaluation } from "./validator";
import type { EvaluationResult } from "../shared/types";

export interface MarkingInput {
  essayText: string;
  essayType: "situational" | "continuous";
  essaySubType?: string;
  prompt: string;
  guidingPoints?: string[];
  level?: string;
}

export async function evaluateEssay(input: MarkingInput): Promise<EvaluationResult> {
  const rubric = input.essayType === "situational"
    ? getSituationalRubric(input.essaySubType)
    : getContinuousRubric(input.essaySubType);

  const promptKey = input.essayType === "situational" ? "marking-sw-v1" : "marking-cw-v1";
  const { system, user } = getPrompt(promptKey, {
    essayText: input.essayText,
    essayType: input.essayType,
    essaySubType: input.essaySubType ?? "",
    prompt: input.prompt,
    guidingPoints: input.guidingPoints?.join("\n") ?? "",
    rubric: JSON.stringify(rubric),
    level: input.level ?? "sec4",
  });

  const rawResult = await withRetry(
    () => chatCompletion(system, user, { model: MODEL_EVALUATION, maxTokens: 4000, jsonMode: true, reasoningEffort: "high" }),
    2
  );

  let parsed: any;
  try {
    parsed = JSON.parse(rawResult);
  } catch {
    throw new MarkingError("Failed to parse AI evaluation response as JSON");
  }

  const result: EvaluationResult = {
    essayType: input.essayType,
    rubricVersion: rubric.version,
    modelId: MODEL_EVALUATION,
    promptVersion: promptKey,
    dimensionScores: parsed.dimensionScores ?? [],
    totalScore: parsed.totalScore ?? 0,
    band: parsed.band ?? 0,
    strengths: parsed.strengths ?? [],
    weaknesses: parsed.weaknesses ?? [],
    nextSteps: parsed.nextSteps ?? [],
    confidence: parsed.confidence ?? 0.5,
    reviewRecommended: parsed.reviewRecommended ?? true,
  };

  validateEvaluation(result, rubric);
  return result;
}
