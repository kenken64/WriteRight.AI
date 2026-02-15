import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ draftId: string }> }) {
  const { draftId } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { data: draft } = await supabase
      .from("essay_drafts")
      .select("*, assignments:assignment_id(prompt, essay_type, guiding_points)")
      .eq("id", draftId)
      .single();

    if (!draft) return NextResponse.json({ error: "Draft not found" }, { status: 404 });

    const { generateOutline } = await import("@writeright/ai/writing-assistant/outline-generator");
    const assignment = (draft as any).assignments;

    const result = await generateOutline({
      topic: assignment?.prompt ?? "",
      essayType: assignment?.essay_type ?? "continuous",
      guidingPoints: assignment?.guiding_points ?? [],
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
