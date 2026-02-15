import { NextRequest, NextResponse } from "next/server";
import { requireRole, isAuthError } from "@/lib/middleware/rbac";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireRole(req, 'student');
  if (isAuthError(auth)) return auth;

  const { data: redemption } = await auth.supabase
    .from("redemptions")
    .select("*")
    .eq("id", id)
    .single();

  if (!redemption) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!["acknowledged", "pending_fulfilment", "overdue"].includes(redemption.status)) {
    return NextResponse.json({ error: "Cannot nudge in current state" }, { status: 400 });
  }
  // TODO: Send push notification to parent
  const { data, error } = await auth.supabase
    .from("audit_logs")
    .insert({ user_id: auth.user.id, action: "nudge_sent", entity_type: "redemption", entity_id: id, metadata: {} })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error?.message ?? "Failed" }, { status: 500 });
  return NextResponse.json({ message: "Nudge sent", nudge: data });
}
