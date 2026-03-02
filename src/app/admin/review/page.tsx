import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminReviewClient from "./AdminReviewClient";

export const metadata = {
  title: "Review Queue — AdilStore Admin",
};

export default async function AdminReviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/signin?next=/admin/review");

  // Check admin role
  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (roleRow?.role !== "admin") {
    redirect("/");
  }

  // Fetch pending submissions
  const { data: submissions } = await supabase
    .from("app_submissions")
    .select("*, developer_profiles(display_name, contact_email, website)")
    .order("created_at", { ascending: true });

  return <AdminReviewClient submissions={submissions ?? []} />;
}
