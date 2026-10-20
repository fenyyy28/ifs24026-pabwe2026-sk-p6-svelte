import { writable } from 'svelte/store'

/**
 * access:
 *  - 'guest'  : hanya untuk yang belum login
 *  - 'user'   : hanya untuk yang sudah login
 *  - 'public' : siapa saja
 * layout: 'auth' (layout autentikasi), 'app' (navbar + sidebar), 'none'
 */
export const routes = [
  { name: 'login', path: '/auth/login', access: 'guest', layout: 'auth' },
  { name: 'register', path: '/auth/register', access: 'guest', layout: 'auth' },
  { name: 'home', path: '/', access: 'user', layout: 'app' },
  { name: 'detail', path: '/link-trees/:linkTreeId', access: 'user', layout: 'app' },
  { name: 'users', path: '/users', access: 'user', layout: 'app' },
  { name: 'profile', path: '/profile', access: 'user', layout: 'app' },
]

export const notFoundRoute = { name: 'not-found', path: '*', access: 'public', layout: 'none' }

export function normalizePath(value) {
  let clean = String(value).split('?')[0].split('#')[0]
  if (clean.length > 1) clean = clean.replace(/\/+$/, '')
  return clean || '/'
}

function safeDecode(value) {
  try {
    return decodeURIComponent(value)
  } catch {
    return value
  }
}

export function matchRoute(pathname) {
  const segments = normalizePath(pathname).split('/').filter(Boolean)

  for (const route of routes) {
    const routeSegments = route.path.split('/').filter(Boolean)
    if (routeSegments.length !== segments.length) continue

    const params = {}
    const matched = routeSegments.every((part, i) => {
      if (part.startsWith(':')) {
        params[part.slice(1)] = safeDecode(segments[i])
        return true
      }
      return part === segments[i]
    })

    if (matched) return { route, params }
  }

  return { route: notFoundRoute, params: {} }
}

// Menentukan apa yang tampil, termasuk pengalihan karena status login
export function resolveRoute(pathname, authenticated) {
  const { route, params } = matchRoute(pathname)

  if (route.access === 'guest' && authenticated) return { redirect: '/' }
  if (route.access === 'user' && !authenticated) return { redirect: '/auth/login' }

  return { route, params, redirect: null }
}

export const path = writable(normalizePath(window.location.pathname))

export function navigate(to, { replace = false } = {}) {
  if (replace) history.replaceState({}, '', to)
  else history.pushState({}, '', to)
  path.set(normalizePath(to))
}

window.addEventListener('popstate', () => path.set(normalizePath(window.location.pathname)))