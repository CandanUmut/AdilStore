import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hashInstallFingerprint } from "@/lib/sharing";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { app_id, source = "direct" } = body;

    if (!app_id || typeof app_id !== "string") {
      return NextResponse.json({ error: "app_id required" }, { status: 400 });
    }

    const validSources = ["direct", "share_link", "search", "featured", "category"];
    const install_source = validSources.includes(source) ? source : "direct";

    const userAgent = req.headers.get("user-agent") ?? "";
    const uaHash = await hashInstallFingerprint(userAgent);

    const supabase = await createClient();
    await supabase.from("installs").insert({
      app_id,
      install_source: install_source as "direct" | "share_link" | "search" | "featured" | "category",
      user_agent_hash: uaHash,
    });

    return NextResponse.json({ ok: true });
  } catch {
    // Install tracking is best-effort — never fail the user
    return NextResponse.json({ ok: true });
  }
}
