import { describe, it, expect, vi, beforeEach } from 'vitest'
import { get } from 'svelte/store'

vi.mock('../../lib/helpers/apiHelper.js', async (orig) => ({
  ...(await orig()),
  apiRequest: vi.fn(),
}))

import { apiRequest } from '../../lib/helpers/apiHelper.js'
import { profile } from '../users/userStore.js'
import { token, isAuthenticated, register, login, logout } from './authStore.js'

beforeEach(() => {
  apiRequest.mockReset()
  token.set(null)
})

describe('authStore', () => {
  it('isAuthenticated mengikuti token', () => {
    expect(get(isAuthenticated)).toBe(false)
    token.set('abc')
    expect(get(isAuthenticated)).toBe(true)
  })

  it('register memanggil API tanpa token', async () => {
    apiRequest.mockResolvedValue({})
    await register({ name: 'A', email: 'a@b.co', password: 'secret1' })
    expect(apiRequest).toHaveBeenCalledWith('/auth/register', {
      method: 'POST',
      body: { name: 'A', email: 'a@b.co', password: 'secret1' },
      auth: false,
    })
  })

  it('login menyimpan token', async () => {
    apiRequest.mockResolvedValue({ data: { token: 'tkn' } })
    await login({ email: 'a@b.co', password: 'secret1' })
    expect(localStorage.getItem('token')).toBe('tkn')
    expect(get(token)).toBe('tkn')
    expect(get(isAuthenticated)).toBe(true)
  })

  it('login gagal jika respons tanpa token', async () => {
    apiRequest.mockResolvedValue({ data: {} })
    await expect(login({ email: 'a', password: 'b' })).rejects.toThrow('Token tidak ditemukan')
    apiRequest.mockResolvedValue({})
    await expect(login({ email: 'a', password: 'b' })).rejects.toThrow('Token tidak ditemukan')
    expect(localStorage.getItem('token')).toBeNull()
  })

  it('logout menghapus token dan profil', () => {
    localStorage.setItem('token', 'tkn')
    token.set('tkn')
    profile.set({ id: 1 })
    logout()
    expect(localStorage.getItem('token')).toBeNull()
    expect(get(token)).toBeNull()
    expect(get(profile)).toBeNull()
  })
})
