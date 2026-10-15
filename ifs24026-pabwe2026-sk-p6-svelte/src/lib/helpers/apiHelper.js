const BASE_URL = import.meta.env.VITE_DELCOM_BASEURL

export function getToken() {
  return localStorage.getItem('token')
}

export function setToken(token) {
  localStorage.setItem('token', token)
}

export function removeToken() {
  localStorage.removeItem('token')
}

export async function apiRequest(path, { method = 'GET', body, auth = true } = {}) {
  const isForm = body instanceof FormData
  const headers = {}

  // Untuk FormData, browser mengatur Content-Type + boundary sendiri
  if (!isForm) headers['Content-Type'] = 'application/json'

  const token = getToken()
  if (auth && token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  })

  const json = await res.json().catch(() => ({}))

  if (!res.ok || json.status === 'fail') {
    const details = json.data?.field ? Object.values(json.data.field).flat().join(' ') : ''
    const message = json.message || `Request gagal (${res.status})`
    throw new Error(details ? `${message}: ${details}` : message)
  }
  return json
}