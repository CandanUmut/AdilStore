import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { hashInstallFingerprint } from "@/lib/sharing";
import { headers } from "next/headers";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  try {
    const supabase = await createClient();

    // Look up share link
    const { data: link } = await supabase
      .from("share_links")
      .select("id, app_id, install_count")
      .eq("token", token)
      .single();

    if (!link) {
      return NextResponse.redirect(`${siteUrl}/`, { status: 302 });
    }

    // Fetch app slug
    const { data: app } = await supabase
      .from("apps")
      .select("slug")
      .eq("id", link.app_id)
      .single();

    if (!app) {
      return NextResponse.redirect(`${siteUrl}/`, { status: 302 });
    }

    // Record install event (fire-and-forget style — don't block redirect)
    const headersList = await headers();
    const userAgent = headersList.get("user-agent") ?? "";
    const uaHash = await hashInstallFingerprint(userAgent);

    // Update install count on share link (non-blocking)
    supabase
      .from("share_links")
      .update({ install_count: link.install_count + 1 })
      .eq("id", link.id)
      .then(() => {});

    // Record in installs table
    supabase
      .from("installs")
      .insert({
        app_id: link.app_id,
        install_source: "share_link",
        share_link_id: link.id,
        user_agent_hash: uaHash,
      })
      .then(() => {});

    return NextResponse.redirect(`${siteUrl}/app/${app.slug}`, { status: 302 });
  } catch {
    return NextResponse.redirect(`${siteUrl}/`, { status: 302 });
  }
}
