import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();

  const host = (await headers()).get("host") ?? req.headers.get("host") ?? "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  return NextResponse.redirect(new URL("/login", `${protocol}://${host}`));
}
