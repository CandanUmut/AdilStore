import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import AppDetailClient from "./AppDetailClient";
import type { Review } from "@/types/database.types";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("apps")
      .select("name, description_en, icon_filename")
      .eq("slug", slug)
      .eq("is_published", true)
      .single();

    if (!data) return { title: "App not found" };

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    return {
      title: data.name,
      description: data.description_en?.slice(0, 160),
      openGraph: {
        title: `${data.name} · AdilStore`,
        description: data.description_en?.slice(0, 160),
        url: `${siteUrl}/app/${slug}`,
        images: data.icon_filename
          ? [{ url: `${siteUrl}/icons/${data.icon_filename}`, width: 256, height: 256 }]
          : undefined,
      },
      twitter: {
        card: "summary",
        title: `${data.name} · AdilStore`,
        description: data.description_en?.slice(0, 160),
      },
    };
  } catch {
    return { title: "App" };
  }
}

export default async function AppDetailPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: app } = await supabase
    .from("apps")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!app) notFound();

  // Fetch reviews for this app
  const { data: reviewsData } = await supabase
    .from("reviews")
    .select("id, app_id, user_id, nickname, score, comment, is_verified_install, helpful_count, is_published, developer_reply, developer_reply_at, created_at")
    .eq("app_id", app.id)
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(20);

  const reviews: Review[] = reviewsData ?? [];

  const ratingAvg = reviews.length
    ? reviews.reduce((s, r) => s + r.score, 0) / reviews.length
    : null;

  return (
    <AppDetailClient
      app={app}
      reviews={reviews}
      ratingAvg={ratingAvg}
    />
  );
}
