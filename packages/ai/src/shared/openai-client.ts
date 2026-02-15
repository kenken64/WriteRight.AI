import OpenAI from "openai";
import { MODEL_PRIMARY } from "./model-config";

let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      maxRetries: 2,
      timeout: 60_000,
    });
  }
  return _client;
}

/** GPT-5 models are reasoning models: no temperature support, use max_completion_tokens */
function isReasoningModel(model: string): boolean {
  return model.startsWith("gpt-5") || model.startsWith("o1") || model.startsWith("o3");
}

export async function chatCompletion(
  systemPrompt: string,
  userPrompt: string,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
    reasoningEffort?: "low" | "medium" | "high";
  } = {}
): Promise<string> {
  const client = getOpenAIClient();
  const { model = MODEL_PRIMARY, temperature = 0.3, maxTokens = 4096, jsonMode = false, reasoningEffort } = options;
  const reasoning = isReasoningModel(model);

  const response = await client.chat.completions.create({
    model,
    // Reasoning models (gpt-5, o1, o3) don't support temperature — omit it
    ...(reasoning ? {} : { temperature }),
    // gpt-5 requires max_completion_tokens instead of max_tokens
    ...(reasoning
      ? { max_completion_tokens: maxTokens }
      : { max_tokens: maxTokens }),
    // Pass reasoning_effort for reasoning models
    ...(reasoning && reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
    response_format: jsonMode ? { type: "json_object" } : undefined,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  } as any);

  return response.choices[0]?.message?.content ?? "";
}

export async function visionCompletion(
  systemPrompt: string,
  imageUrls: string[],
  userPrompt: string,
  options: { model?: string; maxTokens?: number } = {}
): Promise<string> {
  const client = getOpenAIClient();
  const { model = MODEL_PRIMARY, maxTokens = 4096 } = options;
  const reasoning = isReasoningModel(model);

  const imageContent = imageUrls.map((url) => ({
    type: "image_url" as const,
    image_url: { url, detail: "high" as const },
  }));

  const response = await client.chat.completions.create({
    model,
    ...(reasoning
      ? { max_completion_tokens: maxTokens }
      : { max_tokens: maxTokens }),
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [...imageContent, { type: "text" as const, text: userPrompt }],
      },
    ],
  } as any);

  return response.choices[0]?.message?.content ?? "";
}
