export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      apps: {
        Row: {
          id: string;
          slug: string;
          name: string;
          category_id: string | null;
          developer_id: string | null;
          url: string;
          preview_url: string | null;
          description_en: string;
          description_tr: string | null;
          tags_en: string[];
          tags_tr: string[];
          platforms_en: string[];
          platforms_tr: string[];
          icon_filename: string | null;
          screenshots: string[];
          is_published: boolean;
          is_featured: boolean;
          is_external: boolean;
          sort_order: number;
          install_count: number;
          ranking_score: number;
          version: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["apps"]["Row"], "id" | "created_at" | "updated_at" | "install_count" | "ranking_score">;
        Update: Partial<Database["public"]["Tables"]["apps"]["Insert"]>;
      };
      reviews: {
        Row: {
          id: string;
          app_id: string;
          user_id: string | null;
          nickname: string | null;
          score: number;
          comment: string | null;
          is_verified_install: boolean;
          helpful_count: number;
          is_published: boolean;
          developer_reply: string | null;
          developer_reply_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["reviews"]["Row"], "id" | "created_at" | "helpful_count">;
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
      };
      installs: {
        Row: {
          id: string;
          app_id: string;
          install_source: "direct" | "share_link" | "search" | "featured" | "category";
          share_link_id: string | null;
          user_agent_hash: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["installs"]["Row"], "id" | "created_at">;
        Update: never;
      };
      share_links: {
        Row: {
          id: string;
          app_id: string;
          token: string;
          source_hint: string | null;
          install_count: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["share_links"]["Row"], "id" | "created_at" | "install_count">;
        Update: Partial<Database["public"]["Tables"]["share_links"]["Insert"]>;
      };
      categories: {
        Row: {
          id: string;
          name_en: string;
          name_tr: string | null;
          sort_order: number;
          icon: string | null;
        };
        Insert: Database["public"]["Tables"]["categories"]["Row"];
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
      };
      developer_profiles: {
        Row: {
          id: string;
          user_id: string;
          display_name: string;
          website: string | null;
          bio: string | null;
          contact_email: string;
          is_verified: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["developer_profiles"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["developer_profiles"]["Insert"]>;
      };
      app_submissions: {
        Row: {
          id: string;
          developer_id: string | null;
          app_name: string;
          app_url: string;
          category_id: string | null;
          description_en: string;
          description_tr: string | null;
          contact_email: string;
          extra_notes: string | null;
          icon_path: string | null;
          screenshots: string[];
          status: "pending" | "approved" | "rejected" | "needs_changes";
          reviewer_notes: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["app_submissions"]["Row"], "id" | "created_at" | "status" | "reviewer_notes" | "reviewed_by" | "reviewed_at">;
        Update: Partial<Database["public"]["Tables"]["app_submissions"]["Insert"]>;
      };
      user_roles: {
        Row: {
          user_id: string;
          role: "user" | "developer" | "admin";
          updated_at: string;
        };
        Insert: Database["public"]["Tables"]["user_roles"]["Row"];
        Update: Partial<Database["public"]["Tables"]["user_roles"]["Insert"]>;
      };
      reports: {
        Row: {
          id: string;
          app_id: string;
          reporter_id: string | null;
          reason: "malware" | "spam" | "privacy" | "misleading" | "other";
          description: string | null;
          created_at: string;
          resolved: boolean;
          resolution_note: string | null;
          resolved_by: string | null;
          resolved_at: string | null;
        };
        Insert: Omit<Database["public"]["Tables"]["reports"]["Row"], "id" | "created_at" | "resolved" | "resolution_note" | "resolved_by" | "resolved_at">;
        Update: Partial<Database["public"]["Tables"]["reports"]["Insert"]>;
      };
      audit_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          resource_type: string;
          resource_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["audit_logs"]["Row"], "id" | "created_at">;
        Update: never;
      };
    };
  };
}

// Convenience types used throughout the app
export type App = Database["public"]["Tables"]["apps"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type Install = Database["public"]["Tables"]["installs"]["Row"];
export type ShareLink = Database["public"]["Tables"]["share_links"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type DeveloperProfile = Database["public"]["Tables"]["developer_profiles"]["Row"];
export type AppSubmission = Database["public"]["Tables"]["app_submissions"]["Row"];
export type UserRole = Database["public"]["Tables"]["user_roles"]["Row"];
export type Report = Database["public"]["Tables"]["reports"]["Row"];

export interface AppWithRatings extends App {
  rating_avg: number | null;
  rating_count: number;
  latest_reviews: Pick<Review, "nickname" | "score" | "comment" | "created_at">[];
}

export type Lang = "en" | "tr";

export function localizedText(app: App, field: "description" | "tags" | "platforms", lang: Lang): string | string[] {
  if (field === "description") return (lang === "tr" && app.description_tr) ? app.description_tr : app.description_en;
  if (field === "tags") return (lang === "tr" && app.tags_tr?.length) ? app.tags_tr : app.tags_en;
  if (field === "platforms") return (lang === "tr" && app.platforms_tr?.length) ? app.platforms_tr : app.platforms_en;
  return "";
}
