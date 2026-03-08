"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AuthCallbackClient() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();

    async function handleCallback() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const next = params.get("next") ?? "/developer";
      const safeNext = next.startsWith("/") ? next : "/developer";

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) {
          router.replace(safeNext);
          return;
        }
      }

      // Also handle hash-based tokens (magic links, OAuth)
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace(safeNext);
        return;
      }

      router.replace("/auth/signin?error=auth_failed");
    }

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-sm text-[var(--text-soft)]">Signing you in…</div>
    </div>
  );
}
