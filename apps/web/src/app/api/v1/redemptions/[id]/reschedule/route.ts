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

  const body = await req.json();
  const newDeadline = body.newDeadline;
  if (!newDeadline) return NextResponse.json({ error: "newDeadline required" }, { status: 400 });
  const { data, error } = await auth.supabase
    .from("redemptions")
    .update({ status: "rescheduled", fulfilment_deadline: newDeadline })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ redemption: data });
}
