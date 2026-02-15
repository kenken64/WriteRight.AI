import { NextRequest, NextResponse } from "next/server";
import { requireRole, isAuthError } from "@/lib/middleware/rbac";
import { auditLog } from "@/lib/middleware/audit";

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

  if (!["acknowledged", "pending_fulfilment"].includes(redemption.status)) {
    return NextResponse.json({ error: "Cannot fulfil in current state" }, { status: 400 });
  }
  const { data, error } = await auth.supabase
    .from("redemptions")
    .update({ status: "completed", fulfilled_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  if (!error) {
    await auth.supabase.from("wishlist_items").update({ status: "fulfilled", fulfilled_at: new Date().toISOString() }).eq("id", redemption.wishlist_item_id);
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await auditLog(auth.supabase, { actorId: auth.user.id, action: 'redemption_fulfilled', entityType: 'redemption', entityId: id });

  return NextResponse.json({ redemption: data });
}
