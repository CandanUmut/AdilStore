/**
 * Data access layer — all Supabase queries live here.
 * Components never call supabase directly.
 */

import { supabase, isConfigured } from './supabase.js';
import { setState, getState } from './state.js';

// ─── Apps ───────────────────────────────────────────

export async function loadApps() {
  if (!isConfigured()) {
    setState({ apps: [], hasBackend: false, loading: false });
    return;
  }

  const { data, error } = await supabase
    .from('apps')
    .select('*, developers(display_name)')
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('rank_score', { ascending: false })
    .order('created_at', { ascending: false });

  if (error || !data?.length) {
    // Fall back to legacy table if new schema not ready
    const legacy = await loadLegacyApps();
    if (legacy) return;
    setState({ apps: [], hasBackend: false, loading: false });
    return;
  }

  const apps = data.map(normalizeApp);
  setState({ apps, hasBackend: true, loading: false });
}

async function loadLegacyApps() {
  const { data, error } = await supabase
    .from('adil_apps')
    .select('*')
    .eq('is_published', true)
    .order('is_featured', { ascending: false })
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });

  if (error || !data?.length) return false;

  const apps = data.map((row) => ({
    id: row.id,
    slug: row.slug || row.id,
    name: row.name,
    category: row.category,
    url: row.url,
    previewUrl: row.preview_url || row.url,
    description: { en: row.description_en || '', tr: row.description_tr || '' },
    tags: { en: row.tags_en || [], tr: row.tags_tr || [] },
    platforms: { en: row.platforms_en || [], tr: row.platforms_tr || [] },
    iconFilename: row.icon_filename || null,
    iconUrl: row.icon_url || null,
    isFeatured: !!row.is_featured,
    isExternal: !!row.is_external,
    status: 'published',
    rankScore: 0,
  }));

  setState({ apps, hasBackend: true, loading: false });
  return true;
}

function normalizeApp(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: row.category,
    url: row.url,
    previewUrl: row.preview_url || row.url,
    description: { en: row.description_en || '', tr: row.description_tr || '' },
    tags: { en: row.tags_en || [], tr: row.tags_tr || [] },
    platforms: { en: row.platforms_en || [], tr: row.platforms_tr || [] },
    iconUrl: row.icon_url || null,
    iconFilename: row.icon_filename || null,
    isFeatured: !!row.is_featured,
    isExternal: !!row.is_external,
    status: row.status,
    rankScore: row.rank_score || 0,
    version: row.current_version,
    developerId: row.developer_id,
    developerName: row.developers?.display_name,
    privacyUrl: row.privacy_url,
    sourceUrl: row.source_url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function loadAppBySlug(slug) {
  if (!isConfigured()) return null;

  // Try new schema first
  let { data } = await supabase
    .from('apps')
    .select('*, developers(display_name, email, website)')
    .eq('slug', slug)
    .maybeSingle();

  if (data) return normalizeApp(data);

  // Fall back to legacy
  const legacy = await supabase
    .from('adil_apps')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();

  return legacy.data ? normalizeApp(legacy.data) : null;
}

// ─── Ratings ────────────────────────────────────────

export async function loadRatings() {
  if (!isConfigured()) {
    setState({ appRatings: {} });
    return;
  }

  // Try new schema first
  let { data, error } = await supabase
    .from('reviews')
    .select('app_id, score, display_name, comment, created_at, is_verified_install')
    .eq('status', 'visible')
    .order('created_at', { ascending: false });

  if (error || !data) {
    // Fall back to legacy
    const legacy = await supabase
      .from('adil_app_ratings')
      .select('app_id, score, nickname, comment, created_at')
      .order('created_at', { ascending: false });

    data = legacy.data;
    if (!data) {
      setState({ appRatings: {} });
      return;
    }
  }

  const map = {};
  for (const row of data) {
    const appId = row.app_id;
    if (!map[appId]) map[appId] = { sum: 0, count: 0, latest: [] };
    map[appId].sum += row.score;
    map[appId].count += 1;
    if ((row.comment || row.display_name) && map[appId].latest.length < 5) {
      map[appId].latest.push({
        name: row.display_name || row.nickname || null,
        comment: row.comment,
        createdAt: row.created_at,
        verified: !!row.is_verified_install,
      });
    }
  }

  const appRatings = {};
  for (const [appId, info] of Object.entries(map)) {
    appRatings[appId] = {
      avg: info.count ? info.sum / info.count : null,
      count: info.count,
      latest: info.latest,
    };
  }
  setState({ appRatings });
}

export async function submitRating(appId, score, nickname, comment) {
  if (!isConfigured()) throw new Error('Backend not configured');
  const { user } = getState();

  // Try new schema
  const { error } = await supabase.from('reviews').insert({
    app_id: appId,
    user_id: user?.id || null,
    score,
    display_name: nickname || null,
    comment: comment || null,
    is_verified_install: false,
  });

  if (error) {
    // Fall back to legacy
    const { error: legacyErr } = await supabase.from('adil_app_ratings').insert({
      app_id: appId,
      score,
      nickname: nickname || null,
      comment: comment || null,
    });
    if (legacyErr) throw legacyErr;
  }
}

// ─── App Submission ─────────────────────────────────

export async function submitApp(payload, iconFile) {
  if (!isConfigured()) throw new Error('Backend not configured');

  let iconPath = null;
  if (iconFile && iconFile.size > 0) {
    const ext = iconFile.name.split('.').pop() || 'png';
    const storagePath = `submissions/${Date.now()}-${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('adil-icons')
      .upload(storagePath, iconFile, { contentType: iconFile.type || 'image/png', upsert: false });
    if (!uploadError) iconPath = storagePath;
  }

  // Try new schema
  const { error } = await supabase.from('app_submissions').insert({
    ...payload,
    icon_path: iconPath,
    status: 'pending',
  });

  if (error) {
    // Fall back to legacy table
    const { error: legacyErr } = await supabase.from('adil_app_submissions').insert({
      app_name: payload.name,
      app_url: payload.url,
      category: payload.category,
      description: payload.description_en,
      contact_email: payload.contact_email,
      extra_notes: payload.extra_notes,
      icon_path: iconPath,
    });
    if (legacyErr) throw legacyErr;
  }
}

// ─── Developer Apps ─────────────────────────────────

export async function loadDeveloperApps(developerId) {
  const { data, error } = await supabase
    .from('apps')
    .select('*')
    .eq('developer_id', developerId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(normalizeApp);
}

// ─── Review Queue (Admin) ───────────────────────────

export async function loadReviewQueue() {
  const { data, error } = await supabase
    .from('app_submissions')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function reviewSubmission(id, decision, notes) {
  const { error } = await supabase
    .from('app_submissions')
    .update({ status: decision, review_notes: notes, reviewed_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}

// ─── Share Links ────────────────────────────────────

export async function trackShareClick(appId, medium) {
  if (!isConfigured()) return;
  await supabase.from('share_links').insert({
    app_id: appId,
    medium,
    clicked_at: new Date().toISOString(),
  });
}

// ─── Install Tracking ───────────────────────────────

export async function trackInstall(appId) {
  if (!isConfigured()) return;
  const { user } = getState();
  await supabase.from('installs').insert({
    app_id: appId,
    user_id: user?.id || null,
    installed_at: new Date().toISOString(),
  });
}
