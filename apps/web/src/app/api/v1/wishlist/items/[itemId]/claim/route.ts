import { NextRequest, NextResponse } from "next/server";
import { requireRole, isAuthError } from "@/lib/middleware/rbac";

export async function POST(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  // Student only — students claim rewards
  const auth = await requireRole(req, 'student');
  if (isAuthError(auth)) return auth;

  const { data: item } = await auth.supabase
    .from("wishlist_items")
    .select("*")
    .eq("id", itemId)
    .single();

  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (item.status !== "claimable") {
    return NextResponse.json({ error: "Item is not claimable" }, { status: 400 });
  }

  // Verify this student owns this wishlist item
  const { data: profile } = await auth.supabase
    .from("student_profiles")
    .select("id")
    .eq("user_id", auth.user.id)
    .single();

  if (!profile || profile.id !== item.student_id) {
    return NextResponse.json({ error: "Forbidden: not your wishlist item" }, { status: 403 });
  }

  // Check if required achievement is unlocked
  if (item.required_achievement_id) {
    const { data: ach } = await auth.supabase
      .from("student_achievements")
      .select("id")
      .eq("student_id", item.student_id)
      .eq("achievement_id", item.required_achievement_id)
      .single();

    if (!ach) return NextResponse.json({ error: "Required achievement not unlocked" }, { status: 403 });
  }

  const now = new Date().toISOString();
  await auth.supabase.from("wishlist_items").update({ status: "claimed", claimed_at: now }).eq("id", itemId);

  // Get parent ID from link
  const { data: link } = await auth.supabase
    .from("parent_student_links")
    .select("parent_id")
    .eq("student_id", item.student_id)
    .single();

  const { data: redemption, error } = await auth.supabase.from("redemptions").insert({
    wishlist_item_id: itemId,
    student_id: item.student_id,
    parent_id: link?.parent_id ?? null,
    achievement_id: item.required_achievement_id,
    status: "claimed",
    fulfilment_deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
    kid_confirmed: false,
    claimed_at: now,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ redemption }, { status: 201 });
}
