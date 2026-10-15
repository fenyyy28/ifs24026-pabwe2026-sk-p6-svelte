import { describe, it, expect, vi, beforeEach } from 'vitest'
import { get } from 'svelte/store'

vi.mock('../../lib/helpers/apiHelper.js', () => ({ apiRequest: vi.fn() }))

import { apiRequest } from '../../lib/helpers/apiHelper.js'
import {
  profile, users, fetchUsers, fetchProfile, updateProfile, uploadPhoto, changePassword,
} from './userStore.js'

beforeEach(() => {
  apiRequest.mockReset()
  profile.set(null)
  users.set([])
})

describe('userStore', () => {
  it('fetchUsers', async () => {
    apiRequest.mockResolvedValue({ data: { users: [{ id: 1 }] } })
    await fetchUsers()
    expect(apiRequest).toHaveBeenCalledWith('/users')
    expect(get(users)).toEqual([{ id: 1 }])
  })

  it('fetchProfile mengisi store dan mengembalikan user', async () => {
    apiRequest.mockResolvedValue({ data: { user: { id: 2, name: 'A' } } })
    expect(await fetchProfile()).toEqual({ id: 2, name: 'A' })
    expect(get(profile)).toEqual({ id: 2, name: 'A' })
  })

  it('updateProfile memakai user dari respons bila ada', async () => {
    apiRequest.mockResolvedValue({ data: { user: { id: 2, name: 'Baru' } } })
    await updateProfile({ name: 'Baru', email: 'a@b.co' })
    expect(apiRequest).toHaveBeenCalledWith('/users/me', {
      method: 'PUT',
      body: { name: 'Baru', email: 'a@b.co' },
    })
    expect(get(profile).name).toBe('Baru')
  })

  it('updateProfile memuat ulang profil bila respons tanpa user', async () => {
    apiRequest
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ data: { user: { id: 2, name: 'Dari GET' } } })
    await updateProfile({ name: 'x', email: 'a@b.co' })
    expect(apiRequest).toHaveBeenCalledTimes(2)
    expect(get(profile).name).toBe('Dari GET')
  })

  it('updateProfile tahan terhadap data tanpa user', async () => {
    apiRequest
      .mockResolvedValueOnce({ data: {} })
      .mockResolvedValueOnce({ data: { user: { id: 3 } } })
    await updateProfile({ name: 'x', email: 'a@b.co' })
    expect(get(profile)).toEqual({ id: 3 })
  })

  it('uploadPhoto mengirim FormData lalu memuat ulang profil', async () => {
    apiRequest
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ data: { user: { id: 2, photo: 'p.png' } } })
    const file = new File(['x'], 'p.png', { type: 'image/png' })
    await uploadPhoto(file)
    const [url, opts] = apiRequest.mock.calls[0]
    expect(url).toBe('/users/me/photo')
    expect(opts.body.get('photo')).toBe(file)
    expect(get(profile).photo).toBe('p.png')
  })

  it('changePassword memetakan field ke format API', async () => {
    apiRequest.mockResolvedValue({})
    await changePassword({ password: 'lama', newPassword: 'baru12', confirmation: 'baru12' })
    expect(apiRequest).toHaveBeenCalledWith('/users/password', {
      method: 'PUT',
      body: { password: 'lama', new_password: 'baru12', new_password_confirmation: 'baru12' },
    })
  })
})
