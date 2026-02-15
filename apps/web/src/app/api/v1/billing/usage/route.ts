import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: sub } = await supabase.from("subscriptions").select("*").eq("user_id", user.id).single();
  const plan = sub?.plan ?? "free";

  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

  const { count: evalCount } = await supabase
    .from("evaluations")
    .select("*", { count: "exact", head: true })
    .gte("created_at", monthStart);

  const { count: topicCount } = await supabase
    .from("topics")
    .select("*", { count: "exact", head: true })
    .gte("created_at", monthStart);

  const limits = plan === "free"
    ? { evaluations: 10, topics: 5, rewrites: 5 }
    : { evaluations: 100, topics: 50, rewrites: 50 };

  return NextResponse.json({
    plan,
    period: { start: monthStart, end: sub?.current_period_end },
    usage: { evaluations: evalCount ?? 0, topics: topicCount ?? 0 },
    limits,
  });
}
