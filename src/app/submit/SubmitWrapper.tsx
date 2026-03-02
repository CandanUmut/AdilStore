"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import SubmitClient from "./SubmitClient";

export default function SubmitWrapper() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [developerId, setDeveloperId] = useState("");
  const [defaultEmail, setDefaultEmail] = useState("");

  useEffect(() => {
    const supabase = createClient();

    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth/signin?next=/submit");
        return;
      }

      const { data: profile } = await supabase
        .from("developer_profiles")
        .select("id, contact_email")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        router.replace("/developer/profile?next=/submit");
        return;
      }

      setDeveloperId(profile.id);
      setDefaultEmail(profile.contact_email ?? user.email ?? "");
      setReady(true);
    }

    check();
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-[var(--text-soft)]">Loading…</div>
      </div>
    );
  }

  return <SubmitClient developerId={developerId} defaultEmail={defaultEmail} />;
}
