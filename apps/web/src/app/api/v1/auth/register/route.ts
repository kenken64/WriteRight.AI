import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { auditLog } from "@/lib/middleware/audit";
import { sanitizeInput } from "@/lib/middleware/sanitize";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["parent", "student"]),
  displayName: z.string().min(1).max(50),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, role, displayName } = registerSchema.parse(body);

    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role, display_name: sanitizeInput(displayName) },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (data.user) {
      await supabase.from("users").insert({
        id: data.user.id,
        role,
        email,
        display_name: sanitizeInput(displayName),
        status: "active",
      });

      await auditLog(supabase, {
        actorId: data.user.id,
        action: 'register',
        entityType: 'auth',
        metadata: { role },
      });
    }

    return NextResponse.json({ user: data.user, session: data.session }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: err.errors }, { status: 422 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
