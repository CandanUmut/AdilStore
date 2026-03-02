import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Handles:
//  - Email confirmation links (from signup)
//  - OAuth callbacks (Google, etc.)
//  - Magic link logins (if enabled later)
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/developer";

  // Ensure next is a relative path (prevent open redirect)
  const safeNext = next.startsWith("/") ? next : "/developer";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${safeNext}`);
    }
  }

  // Auth failed — redirect with error message
  return NextResponse.redirect(`${origin}/auth/signin?error=auth_failed`);
}
