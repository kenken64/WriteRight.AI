import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";
import { getCached, putCached } from "@/lib/tts-cache";

const ttsRequestSchema = z.object({
  text: z.string().min(1).max(4096),
  voice: z.enum(["alloy", "echo", "fable", "onyx", "nova", "shimmer"]).optional(),
  speed: z.number().min(0.25).max(4.0).optional(),
  useCase: z.enum(["feedback", "rewrite", "vocabulary"]).optional(),
});

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { text, voice, speed, useCase } = ttsRequestSchema.parse(body);

    const resolvedVoice = voice ?? "nova";
    const resolvedSpeed = speed ?? 1.0;

    // Check disk cache first (Railway volume)
    const cached = await getCached(text, resolvedVoice, resolvedSpeed, useCase);
    if (cached) {
      return new NextResponse(new Uint8Array(cached.audio), {
        status: 200,
        headers: {
          "Content-Type": cached.contentType,
          "Content-Length": String(cached.audio.length),
          "X-TTS-Cache": "HIT",
          "Cache-Control": "private, max-age=86400",
        },
      });
    }

    // Cache miss — generate via OpenAI
    const { synthesise, synthesiseForUseCase } = await import("@writeright/ai/tts/engine");

    const result = useCase
      ? await synthesiseForUseCase(text, useCase, { voice, speed })
      : await synthesise({ text, voice: resolvedVoice, speed: resolvedSpeed });

    // Write to disk cache (fire-and-forget)
    putCached(text, resolvedVoice, resolvedSpeed, result.audio, useCase).catch(() => {});

    return new NextResponse(new Uint8Array(result.audio), {
      status: 200,
      headers: {
        "Content-Type": result.contentType,
        "Content-Length": String(result.audio.length),
        "X-Duration-Estimate-Ms": String(result.durationEstimateMs),
        "X-TTS-Cache": "MISS",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: err.errors }, { status: 422 });
    }
    return NextResponse.json({ error: err.message ?? "TTS generation failed" }, { status: 500 });
  }
}
