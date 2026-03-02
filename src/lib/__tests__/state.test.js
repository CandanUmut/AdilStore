import { describe, it, expect, beforeEach } from 'vitest';
import { getState, setState, subscribe } from '../state.js';

describe('state', () => {
  beforeEach(() => {
    // Reset to defaults
    setState({
      user: null,
      developerProfile: null,
      apps: [],
      appRatings: {},
      currentCategory: 'all',
      searchQuery: '',
      lang: 'en',
      theme: 'dark',
      hasBackend: false,
      loading: true,
    });
  });

  it('returns initial state', () => {
    const state = getState();
    expect(state.lang).toBe('en');
    expect(state.theme).toBe('dark');
    expect(state.apps).toEqual([]);
    expect(state.user).toBeNull();
  });

  it('updates state with setState', () => {
    setState({ lang: 'tr', theme: 'light' });
    const state = getState();
    expect(state.lang).toBe('tr');
    expect(state.theme).toBe('light');
  });

  it('notifies subscribers on state change', () => {
    let notified = false;
    const unsubscribe = subscribe((state) => {
      notified = true;
      expect(state.searchQuery).toBe('test');
    });

    setState({ searchQuery: 'test' });
    expect(notified).toBe(true);

    unsubscribe();
  });

  it('unsubscribe stops notifications', () => {
    let count = 0;
    const unsubscribe = subscribe(() => { count++; });

    setState({ lang: 'tr' });
    expect(count).toBe(1);

    unsubscribe();
    setState({ lang: 'en' });
    expect(count).toBe(1);
  });
});
