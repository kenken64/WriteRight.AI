import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: evaluations } = await supabase
    .from("evaluations")
    .select("*")
    .eq("submission_id", id)
    .order("created_at", { ascending: false });

  if (!evaluations?.length) return NextResponse.json({ error: "No evaluation found" }, { status: 404 });

  const latest = evaluations[0];
  return NextResponse.json({
    totalScore: latest.total_score,
    band: latest.band,
    dimensions: latest.dimension_scores,
    strengths: latest.strengths,
    weaknesses: latest.weaknesses,
    nextSteps: latest.next_steps,
    confidence: latest.confidence,
    reviewRecommended: latest.review_recommended,
  });
}
