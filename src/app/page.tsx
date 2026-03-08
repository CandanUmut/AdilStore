import { createClient } from "@/lib/supabase/server";
import HomeClient from "./HomeClient";
import type { App } from "@/types/database.types";
import { FALLBACK_APPS } from "@/lib/fallback-apps";

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
      apps = appsData as App[];

      const { data: ratingsData } = await supabase
        .from("reviews")
        .select("app_id, score")
        .eq("is_published", true);

      if (ratingsData) {
        const map: Record<string, { sum: number; count: number }> = {};
        for (const r of ratingsData as { app_id: string; score: number }[]) {
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
    // Supabase unavailable during static build — use fallback apps
  }

  return <HomeClient apps={apps} initialRatings={ratingsMap} />;
}
