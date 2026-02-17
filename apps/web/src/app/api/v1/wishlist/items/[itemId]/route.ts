import { NextRequest, NextResponse } from "next/server";
import { requireRole, isAuthError } from "@/lib/middleware/rbac";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  const auth = await requireRole(req, 'parent');
  if (isAuthError(auth)) return auth;

  const body = await req.json();
  const { action, requiredAchievementId } = body as {
    action: string;
    requiredAchievementId?: string;
  };

  if (!action || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  // Fetch the wishlist item
  const { data: item } = await auth.supabase
    .from("wishlist_items")
    .select("*")
    .eq("id", itemId)
    .single();

  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (item.status !== "pending_parent") {
    return NextResponse.json({ error: "Item is not pending approval" }, { status: 400 });
  }

  // Verify parent is linked to this student
  const { count } = await auth.supabase
    .from("parent_student_links")
    .select("parent_id", { count: "exact", head: true })
    .eq("parent_id", auth.user.id)
    .eq("student_id", item.student_id);

  if (!count || count === 0) {
    return NextResponse.json({ error: "Forbidden: not linked to this student" }, { status: 403 });
  }

  if (action === "approve") {
    if (!requiredAchievementId) {
      return NextResponse.json({ error: "requiredAchievementId is required for approval" }, { status: 400 });
    }

    // Verify achievement exists
    const { data: achievement } = await auth.supabase
      .from("achievements")
      .select("id")
      .eq("id", requiredAchievementId)
      .single();

    if (!achievement) {
      return NextResponse.json({ error: "Achievement not found" }, { status: 400 });
    }

    // Check if student already unlocked this achievement
    const { data: alreadyUnlocked } = await auth.supabase
      .from("student_achievements")
      .select("id")
      .eq("student_id", item.student_id)
      .eq("achievement_id", requiredAchievementId)
      .single();

    const newStatus = alreadyUnlocked ? "claimable" : "locked";

    const { data, error } = await auth.supabase
      .from("wishlist_items")
      .update({ status: newStatus, required_achievement_id: requiredAchievementId })
      .eq("id", itemId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ item: data });
  }

  // action === 'reject'
  const { data, error } = await auth.supabase
    .from("wishlist_items")
    .update({ status: "expired" })
    .eq("id", itemId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data });
}
