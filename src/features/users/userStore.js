import { writable } from 'svelte/store'
import { apiRequest } from '../../lib/helpers/apiHelper.js'

export const profile = writable(null)
export const users = writable([])

export async function fetchUsers() {
  const res = await apiRequest('/users')
  users.set(res.data.users)
}

export async function fetchProfile() {
  const res = await apiRequest('/users/me')
  profile.set(res.data.user)
  return res.data.user
}

export async function updateProfile({ name, email }) {
  const res = await apiRequest('/users/me', {
    method: 'PUT',
    body: { name, email },
  })
  if (res.data?.user) profile.set(res.data.user)
  else await fetchProfile()
}

export async function uploadPhoto(file) {
  const form = new FormData()
  form.append('photo', file)
  await apiRequest('/users/me/photo', { method: 'POST', body: form })
  await fetchProfile()
}

export async function changePassword({ password, newPassword, confirmation }) {
  await apiRequest('/users/password', {
    method: 'PUT',
    body: {
      password,
      new_password: newPassword,
      new_password_confirmation: confirmation,
    },
  })
}