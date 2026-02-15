import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateTopicRequestSchema } from "@/lib/validators/schemas";
import { generateFromTrending } from "@writeright/ai/topics/from-trending";
import { generateFromArticle } from "@writeright/ai/topics/from-article";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const params = generateTopicRequestSchema.parse(body);

    // Check subscription usage limits
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .single();

    const plan = sub?.plan ?? "free";
    const { count } = await supabase
      .from("topics")
      .select("*", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 30 * 86400000).toISOString());

    const limit = plan === "free" ? 5 : 50;
    if ((count ?? 0) >= limit) {
      return NextResponse.json({ error: "Monthly topic generation limit reached" }, { status: 429 });
    }

    let generatedPrompts;

    if (params.source === "upload" && params.articleText) {
      const topics = await generateFromArticle(params.articleText, params.essayType, params.level ?? "sec4");
      generatedPrompts = topics;
    } else {
      const topics = await generateFromTrending(params.essayType, params.level ?? "sec4");
      generatedPrompts = topics;
    }

    const { data: topic, error } = await supabase.from("topics").insert({
      source: params.source === "upload" ? "upload" : "trending",
      source_text: params.articleText ?? null,
      essay_type: params.essayType,
      level: params.level ?? null,
      generated_prompts: generatedPrompts,
      created_by: user.id,
    }).select().single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ topic }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Bad request" }, { status: 400 });
  }
}
