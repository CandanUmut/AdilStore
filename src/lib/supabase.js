import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://jezaquyloiwzzaetmpsc.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImplemFxdXlsb2l3enphZXRtcHNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwODYzMTIsImV4cCI6MjA3MDY2MjMxMn0.mcYMxCI_5O3z9ryi90UQHpUOemY7fKKmWmMpDJFOeao';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export function isConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_URL !== 'https://' && SUPABASE_ANON_KEY);
}
