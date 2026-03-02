import { createClient } from "@/lib/supabase/server";
import HomeClient from "./HomeClient";
import type { App } from "@/types/database.types";

// FALLBACK_APPS — used when Supabase is unavailable (same as legacy index.html)
const FALLBACK_APPS: App[] = [
  {
    id: "unmask", slug: "unmask", name: "Unmask · Purity & Power Companion",
    category_id: "spiritual", developer_id: null,
    url: "https://candanumut.github.io/Unmasking_sexual_engineered/",
    preview_url: "https://candanumut.github.io/Unmasking_sexual_engineered/",
    description_en: "Faith-friendly NoFap / reboot companion that shows how engineered sexual conditioning works, helps protect your brain and heart from harmful sexual content, and rebuilds a life of clarity, dignity, and worship. All plans, streaks, and notes stay fully local in your browser.",
    description_tr: "Mühendislik edilmiş cinsel koşullandırmanın nasıl işlediğini gösteren iman dostu bir reboot rehberi.",
    tags_en: ["NoFap", "Faith", "Self-control", "Education"],
    tags_tr: ["NoFap", "İman", "Öz-denetim", "Eğitim"],
    platforms_en: ["Web"], platforms_tr: ["Web"],
    icon_filename: "spiritual-unmask.png", screenshots: [],
    is_published: true, is_featured: true, is_external: false,
    sort_order: 1, install_count: 0, ranking_score: 0, version: null,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
  {
    id: "nova-arena-3d", slug: "nova-arena-3d", name: "Nova Arena 3D · Rogue Survivor",
    category_id: "games", developer_id: null,
    url: "https://candanumut.github.io/newbrotato/",
    preview_url: "https://candanumut.github.io/newbrotato/",
    description_en: "Top-down rogue-survivor in a Perlin-generated world of forests, rocks, lakes, and enemies.",
    description_tr: "Perlin üretimli dünyada yukarıdan görünüşlü rogue-survivor.",
    tags_en: ["Action", "Roguelite", "3D"], tags_tr: ["Aksiyon", "Roguelite", "3D"],
    platforms_en: ["Web"], platforms_tr: ["Web"],
    icon_filename: "games-nova-arena-3d.png", screenshots: [],
    is_published: true, is_featured: true, is_external: false,
    sort_order: 2, install_count: 0, ranking_score: 0, version: null,
    created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
  },
];

export default async function HomePage() {
  let apps: App[] = FALLBACK_APPS;
  const ratingsMap: Record<string, { avg: number | null; count: number }> = {};

  try {
    const supabase = await createClient();

    const { data: appsData } = await supabase
      .from("apps")
      .select("*")
      .eq("is_published", true)
      .order("is_featured", { ascending: false })
      .order("ranking_score", { ascending: false })
      .order("sort_order", { ascending: true });

    if (appsData && appsData.length > 0) {
      apps = appsData;

      // Load rating aggregates
      const { data: ratingsData } = await supabase
        .from("reviews")
        .select("app_id, score")
        .eq("is_published", true);

      if (ratingsData) {
        const map: Record<string, { sum: number; count: number }> = {};
        for (const r of ratingsData) {
          if (!map[r.app_id]) map[r.app_id] = { sum: 0, count: 0 };
          map[r.app_id].sum += r.score;
          map[r.app_id].count += 1;
        }
        for (const [id, info] of Object.entries(map)) {
          ratingsMap[id] = {
            avg: info.count ? info.sum / info.count : null,
            count: info.count,
          };
        }
      }
    }
  } catch {
    // Supabase unavailable — fall back to hardcoded apps
    console.warn("Supabase unavailable, using fallback apps");
  }

  return <HomeClient apps={apps} initialRatings={ratingsMap} />;
}
