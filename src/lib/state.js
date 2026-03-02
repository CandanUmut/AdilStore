/**
 * Simple reactive state store.
 * Listeners are notified on any state change.
 */

const state = {
  user: null,
  developerProfile: null,
  apps: [],
  categories: [],
  appRatings: {},
  currentCategory: 'all',
  searchQuery: '',
  lang: 'en',
  theme: 'dark',
  hasBackend: false,
  loading: true,
};

const listeners = new Set();

export function getState() {
  return state;
}

export function setState(partial) {
  Object.assign(state, partial);
  listeners.forEach((fn) => fn(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
