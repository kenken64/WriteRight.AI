import OpenAI from "openai";
import { MODEL_PRIMARY } from "./model-config";
import { trackUsage } from "./usage-tracker";

let _client: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      maxRetries: 2,
      timeout: 180_000,
    });
  }
  return _client;
}

/** GPT-5 models are reasoning models: no temperature support, use max_completion_tokens */
function isReasoningModel(model: string): boolean {
  return model.startsWith("gpt-5") || model.startsWith("o1") || model.startsWith("o3");
}

export interface TrackingOptions {
  operation: string;
  submissionId?: string;
  userId?: string;
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
    tracking?: TrackingOptions;
  } = {}
): Promise<string> {
  const client = getOpenAIClient();
  const { model = MODEL_PRIMARY, temperature = 0.3, maxTokens = 4096, jsonMode = false, reasoningEffort, tracking } = options;
  const reasoning = isReasoningModel(model);

  const start = Date.now();
  let status: "success" | "error" = "success";
  let errorMsg: string | undefined;

  try {
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

    if (tracking) {
      trackUsage({
        ...tracking,
        model,
        usage: response.usage as any,
        durationMs: Date.now() - start,
        status: "success",
      });
    }

    return response.choices[0]?.message?.content ?? "";
  } catch (err) {
    if (tracking) {
      trackUsage({
        ...tracking,
        model,
        durationMs: Date.now() - start,
        status: "error",
        error: (err as Error).message,
      });
    }
    throw err;
  }
}

export async function visionCompletion(
  systemPrompt: string,
  imageUrls: string[],
  userPrompt: string,
  options: { model?: string; maxTokens?: number; tracking?: TrackingOptions } = {}
): Promise<string> {
  const client = getOpenAIClient();
  const { model = MODEL_PRIMARY, maxTokens = 4096, tracking } = options;
  const reasoning = isReasoningModel(model);

  const fileContent = imageUrls.map((url) => {
    // PDFs must use the "file" content type — "image_url" only supports images
    if (url.startsWith("data:application/pdf")) {
      return {
        type: "file" as const,
        file: { filename: "document.pdf", file_data: url },
      };
    }
    return {
      type: "image_url" as const,
      image_url: { url, detail: "high" as const },
    };
  });

  const start = Date.now();

  try {
    const response = await client.chat.completions.create({
      model,
      ...(reasoning
        ? { max_completion_tokens: maxTokens }
        : { max_tokens: maxTokens }),
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [...fileContent, { type: "text" as const, text: userPrompt }],
        },
      ],
    } as any);

    if (tracking) {
      trackUsage({
        ...tracking,
        model,
        usage: response.usage as any,
        durationMs: Date.now() - start,
        status: "success",
      });
    }

    const content = response.choices[0]?.message?.content ?? "";
    if (!content.trim()) {
      throw new Error(
        `Vision model returned empty response (model: ${model}, images: ${imageUrls.length})`,
      );
    }
    return content;
  } catch (err) {
    if (tracking) {
      trackUsage({
        ...tracking,
        model,
        durationMs: Date.now() - start,
        status: "error",
        error: (err as Error).message,
      });
    }
    throw err;
  }
}
