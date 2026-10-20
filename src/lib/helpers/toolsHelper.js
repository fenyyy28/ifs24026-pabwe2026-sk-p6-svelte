export function formatDate(value) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function isValidUrl(value) {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}
export function resolveAssetUrl(path) {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const origin = new URL(import.meta.env.VITE_DELCOM_BASEURL).origin
  return `${origin}/${path.replace(/^\/+/, '')}`
}
export function resolveCoverUrl(cover) {
  if (!cover || cover.endsWith('/')) return ''
  return resolveAssetUrl(cover)
}