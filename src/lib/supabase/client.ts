import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database.types";

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Validate URL is a real HTTP(S) URL — catches empty strings, "undefined", missing protocol, etc.
  try {
    const parsed = new URL(url ?? "");
    if (!parsed.protocol.startsWith("http")) throw new Error();
  } catch {
    throw new Error(
      `Supabase is not configured correctly. NEXT_PUBLIC_SUPABASE_URL="${url}" is not a valid https:// URL.`
    );
  }

  if (!key) {
    throw new Error("Supabase is not configured. NEXT_PUBLIC_SUPABASE_ANON_KEY is missing.");
  }

  return createBrowserClient<Database>(url!, key);
}
