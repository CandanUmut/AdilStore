"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ShareRedirect({ token }: { token: string }) {
  const router = useRouter();

  useEffect(() => {
    if (!token) { router.replace("/"); return; }

    const supabase = createClient();

    async function doRedirect() {
      const { data: link } = await supabase
        .from("share_links")
        .select("app_id")
        .eq("token", token)
        .single();

      if (!link) { router.replace("/"); return; }

      const { data: app } = await supabase
        .from("apps")
        .select("slug")
        .eq("id", (link as { app_id: string }).app_id)
        .single();

      if (!app) { router.replace("/"); return; }

      // Record install event (fire and forget)
      supabase.from("installs").insert({
        app_id: (link as { app_id: string }).app_id,
        install_source: "share_link",
      }).then(() => {});

      router.replace(`/app/${(app as { slug: string }).slug}`);
    }

    doRedirect();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-sm text-[var(--text-soft)]">Redirecting…</div>
    </div>
  );
}
