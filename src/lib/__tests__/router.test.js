import { describe, it, expect, beforeEach } from 'vitest';
import { addRoute, setNotFound, navigate, currentPath } from '../router.js';

describe('router', () => {
  beforeEach(() => {
    window.location.hash = '';
  });

  it('currentPath returns / when hash is empty', () => {
    expect(currentPath()).toBe('/');
  });

  it('navigate sets hash', () => {
    navigate('/app/test-slug');
    expect(window.location.hash).toBe('#/app/test-slug');
  });

  it('currentPath reads hash', () => {
    window.location.hash = '#/login';
    expect(currentPath()).toBe('/login');
  });
});
