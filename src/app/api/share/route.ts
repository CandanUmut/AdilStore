import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateShareToken } from "@/lib/sharing";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { app_id, source_hint } = body;

    if (!app_id || typeof app_id !== "string") {
      return NextResponse.json({ error: "app_id required" }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify app exists
    const { data: app } = await supabase
      .from("apps")
      .select("slug")
      .eq("id", app_id)
      .eq("is_published", true)
      .single();

    if (!app) {
      return NextResponse.json({ error: "App not found" }, { status: 404 });
    }

    // Generate unique token
    let token = generateShareToken();
    let attempts = 0;
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from("share_links")
        .select("id")
        .eq("token", token)
        .single();
      if (!existing) break;
      token = generateShareToken();
      attempts++;
    }

    const { data: link, error } = await supabase
      .from("share_links")
      .insert({ app_id, token, source_hint: source_hint ?? null })
      .select("token")
      .single();

    if (error || !link) {
      return NextResponse.json({ error: "Failed to create share link" }, { status: 500 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    return NextResponse.json({
      token: link.token,
      url: `${siteUrl}/s/${link.token}`,
      canonical: `${siteUrl}/app/${app.slug}`,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
