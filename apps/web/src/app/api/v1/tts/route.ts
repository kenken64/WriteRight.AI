import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod";

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

    // Lazy-import to keep the AI package out of the initial bundle for other routes
    const { synthesise, synthesiseForUseCase } = await import("@writeright/ai/tts/engine");

    const result = useCase
      ? await synthesiseForUseCase(text, useCase, { voice, speed })
      : await synthesise({ text, voice: voice ?? "nova", speed: speed ?? 1.0 });

    return new NextResponse(new Uint8Array(result.audio), {
      status: 200,
      headers: {
        "Content-Type": result.contentType,
        "Content-Length": String(result.audio.length),
        "X-Duration-Estimate-Ms": String(result.durationEstimateMs),
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
