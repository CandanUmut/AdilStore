/**
 * Minimal hash-based SPA router.
 * Routes are defined as { path: string, handler: (params) => void }.
 * Supports path params: '/app/:slug' matches '/app/my-cool-app' → { slug: 'my-cool-app' }
 */

const routes = [];
let notFoundHandler = null;

export function addRoute(path, handler) {
  const paramNames = [];
  const pattern = path.replace(/:([^/]+)/g, (_, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });
  routes.push({ pattern: new RegExp(`^${pattern}$`), paramNames, handler });
}

export function setNotFound(handler) {
  notFoundHandler = handler;
}

export function navigate(path) {
  window.location.hash = '#' + path;
}

export function currentPath() {
  return window.location.hash.slice(1) || '/';
}

function resolve() {
  const path = currentPath();
  for (const route of routes) {
    const match = path.match(route.pattern);
    if (match) {
      const params = {};
      route.paramNames.forEach((name, i) => {
        params[name] = decodeURIComponent(match[i + 1]);
      });
      route.handler(params);
      return;
    }
  }
  if (notFoundHandler) notFoundHandler();
}

export function startRouter() {
  window.addEventListener('hashchange', resolve);
  resolve();
}

export function onLinkClick(e) {
  const anchor = e.target.closest('a[data-link]');
  if (!anchor) return;
  e.preventDefault();
  navigate(anchor.getAttribute('href'));
}
