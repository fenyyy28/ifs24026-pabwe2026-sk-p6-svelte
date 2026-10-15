import { writable, derived } from 'svelte/store'
import { apiRequest, getToken, setToken, removeToken } from '../../lib/helpers/apiHelper.js'
import { profile } from '../users/userStore.js'

export const token = writable(getToken())
export const isAuthenticated = derived(token, ($token) => !!$token)

export async function register({ name, email, password }) {
  await apiRequest('/auth/register', {
    method: 'POST',
    body: { name, email, password },
    auth: false,
  })
}

export async function login({ email, password }) {
  const res = await apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password },
    auth: false,
  })

  const newToken = res.data?.token
  if (!newToken) throw new Error('Token tidak ditemukan pada respons server')

  setToken(newToken)
  token.set(newToken)
}

export function logout() {
  removeToken()
  token.set(null)
  profile.set(null)
}