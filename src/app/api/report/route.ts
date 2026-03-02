import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { app_id, reason, details } = body as {
      app_id?: string;
      reason?: string;
      details?: string;
    };

    if (!app_id || typeof app_id !== "string") {
      return NextResponse.json({ error: "app_id required" }, { status: 400 });
    }

    const VALID_REASONS = [
      "contains_ads",
      "tracks_users",
      "broken_link",
      "inappropriate_content",
      "spam",
      "other",
    ];

    if (!reason || !VALID_REASONS.includes(reason)) {
      return NextResponse.json({ error: "valid reason required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify app exists
    const { data: app } = await supabase
      .from("apps")
      .select("id")
      .eq("id", app_id)
      .single();

    if (!app) {
      return NextResponse.json({ error: "app not found" }, { status: 404 });
    }

    // Get user if authenticated (optional)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("reports").insert({
      app_id,
      reporter_id: user?.id ?? null,
      reason,
      details: typeof details === "string" ? details.trim().slice(0, 1000) : null,
    });

    if (error) {
      return NextResponse.json({ error: "failed to submit report" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }
}
