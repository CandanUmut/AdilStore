import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DeveloperProfileClient from "./DeveloperProfileClient";

export default async function DeveloperProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/auth/signin?next=/developer/profile");

  const { data: profile } = await supabase
    .from("developer_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <DeveloperProfileClient
      userId={user.id}
      email={user.email ?? ""}
      existingProfile={profile}
    />
  );
}
