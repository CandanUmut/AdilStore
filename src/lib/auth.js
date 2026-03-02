import { supabase } from './supabase.js';
import { setState, getState } from './state.js';

/** Sign up with email + password, sets role to 'user' by default. */
export async function signUp(email, password, displayName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName, role: 'user' },
    },
  });
  if (error) throw error;
  setState({ user: data.user });
  return data;
}

/** Sign in with email + password. */
export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  setState({ user: data.user });
  await loadDeveloperProfile();
  return data;
}

/** OAuth sign-in (Google, GitHub). */
export async function signInWithOAuth(provider) {
  const { error } = await supabase.auth.signInWithOAuth({ provider });
  if (error) throw error;
}

/** Sign out. */
export async function signOut() {
  await supabase.auth.signOut();
  setState({ user: null, developerProfile: null });
}

/** Load the current session on app init. */
export async function initAuth() {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    setState({ user: session.user });
    await loadDeveloperProfile();
  }

  supabase.auth.onAuthStateChange((_event, session) => {
    setState({ user: session?.user ?? null });
    if (session?.user) {
      loadDeveloperProfile();
    } else {
      setState({ developerProfile: null });
    }
  });
}

/** Load developer profile if user has one. */
async function loadDeveloperProfile() {
  const { user } = getState();
  if (!user) return;

  const { data } = await supabase
    .from('developers')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  setState({ developerProfile: data ?? null });
}

/** Apply for a developer account. */
export async function applyAsDeveloper(profile) {
  const { user } = getState();
  if (!user) throw new Error('Must be signed in');

  const { data, error } = await supabase.from('developers').insert({
    user_id: user.id,
    display_name: profile.displayName,
    email: profile.email || user.email,
    website: profile.website || null,
    description: profile.description || null,
    status: 'pending_review',
  }).select().single();

  if (error) throw error;
  setState({ developerProfile: data });
  return data;
}

export function isLoggedIn() {
  return Boolean(getState().user);
}

export function isDeveloper() {
  const { developerProfile } = getState();
  return developerProfile?.status === 'approved';
}

export function isAdmin() {
  const { user } = getState();
  return user?.user_metadata?.role === 'admin';
}
