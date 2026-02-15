import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { auditLog } from "@/lib/middleware/audit";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = loginSchema.parse(body);

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      await auditLog(supabase, {
        actorId: 'unknown',
        action: 'login_failed',
        entityType: 'auth',
        metadata: { email, reason: error.message },
      });
      return NextResponse.json({ error: error.message }, { status: 401 });
    }

    await auditLog(supabase, {
      actorId: data.user.id,
      action: 'login_success',
      entityType: 'auth',
    });

    return NextResponse.json({ user: data.user, session: data.session });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: err.errors }, { status: 422 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
