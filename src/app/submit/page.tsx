import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SubmitClient from "./SubmitClient";

export const metadata = {
  title: "Submit an App — AdilStore",
  description: "Submit your ad-free app to be listed on AdilStore.",
};

export default async function SubmitPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/signin?next=/submit");

  const { data: profile } = await supabase
    .from("developer_profiles")
    .select("id, contact_email")
    .eq("user_id", user.id)
    .single();

  if (!profile) redirect("/developer/profile?next=/submit");

  return (
    <SubmitClient
      developerId={profile.id}
      defaultEmail={profile.contact_email ?? user.email ?? ""}
    />
  );
}
