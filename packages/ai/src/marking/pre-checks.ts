import { chatCompletion } from "../shared/openai-client";
import { MODEL_FAST } from "../shared/model-config";

export interface PreCheckInput {
  essayText: string;
  prompt: string;
  essayType: "situational" | "continuous";
  guidingPoints?: string[];
  submissionId?: string;
}

export interface PreCheckResult {
  passed: boolean;
  language: string;
  isEnglish: boolean;
  topicAlignmentScore: number;
  issues: string[];
}

const SYSTEM_PROMPT = `You are a submission validator for a Singapore English essay grading system.
Your job is to quickly check two things:
1. Is the submission written in English?
2. Does the submission address the given assignment prompt/topic?

Respond with JSON only.`;

export async function runPreEvaluationChecks(
  input: PreCheckInput,
): Promise<PreCheckResult> {
  const { essayText, prompt, essayType, guidingPoints, submissionId } = input;

  // Truncate essay to ~1500 chars for speed and cost
  const truncated = essayText.slice(0, 1500);

  let topicContext = `Assignment prompt: "${prompt}"\nEssay type: ${essayType}`;
  if (guidingPoints?.length) {
    topicContext += `\nGuiding points: ${guidingPoints.join("; ")}`;
  }

  const userPrompt = `${topicContext}

Student submission (first ~1500 characters):
"""
${truncated}
"""

Analyze the submission and respond with this exact JSON structure:
{
  "language": "<detected language, e.g. English, Chinese, Malay, Tamil>",
  "isEnglish": <true or false>,
  "topicAlignmentScore": <0.0 to 1.0, where 1.0 = perfectly on-topic>,
  "topicSummary": "<one sentence describing what the essay is about>"
}`;

  const raw = await chatCompletion(SYSTEM_PROMPT, userPrompt, {
    model: MODEL_FAST,
    temperature: 0,
    maxTokens: 200,
    jsonMode: true,
    tracking: {
      operation: "pre-evaluation-check",
      submissionId,
    },
  });

  const parsed = JSON.parse(raw) as {
    language: string;
    isEnglish: boolean;
    topicAlignmentScore: number;
    topicSummary: string;
  };

  const issues: string[] = [];

  if (!parsed.isEnglish) {
    issues.push(
      `Submission is in ${parsed.language}. Please upload an English essay.`,
    );
  }

  if (parsed.isEnglish && parsed.topicAlignmentScore < 0.3) {
    issues.push(
      `Submission does not appear to match the assignment topic. The essay appears to be about: "${parsed.topicSummary}".`,
    );
  }

  return {
    passed: issues.length === 0,
    language: parsed.language,
    isEnglish: parsed.isEnglish,
    topicAlignmentScore: parsed.topicAlignmentScore,
    issues,
  };
}
