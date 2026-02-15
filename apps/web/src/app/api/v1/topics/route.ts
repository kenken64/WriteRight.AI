import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { sanitizeInput } from "@/lib/middleware/sanitize";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const essayType = searchParams.get("essayType");
  const category = searchParams.get("category");
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20"), 50);

  let query = supabase.from("topics").select("*").order("created_at", { ascending: false }).limit(limit);
  if (essayType) query = query.eq("essay_type", essayType);
  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ topics: data });
}

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { data, error } = await supabase.from("topics").insert({
    source: body.source ?? "manual",
    source_text: body.sourceText ? sanitizeInput(body.sourceText) : null,
    essay_type: body.essayType,
    category: body.category ?? null,
    level: body.level ?? null,
    generated_prompts: body.generatedPrompts ?? null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ topic: data }, { status: 201 });
}
