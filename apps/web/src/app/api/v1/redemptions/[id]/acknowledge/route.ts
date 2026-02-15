import { NextRequest, NextResponse } from "next/server";
import { requireRole, isAuthError } from "@/lib/middleware/rbac";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireRole(req, 'parent');
  if (isAuthError(auth)) return auth;

  const { data: redemption } = await auth.supabase
    .from("redemptions")
    .select("*")
    .eq("id", id)
    .single();

  if (!redemption) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (redemption.status !== "claimed") {
    return NextResponse.json({ error: "Can only acknowledge claimed redemptions" }, { status: 400 });
  }
  const { data, error } = await auth.supabase
    .from("redemptions")
    .update({ status: "acknowledged" })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ redemption: data });
}
