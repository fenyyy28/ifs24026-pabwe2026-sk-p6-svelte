import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createRawSnippet } from 'svelte'
import { render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { get } from 'svelte/store'

vi.mock('../../../lib/helpers/apiHelper.js', async (orig) => ({
  ...(await orig()),
  apiRequest: vi.fn(),
}))

import { apiRequest } from '../../../lib/helpers/apiHelper.js'
import { profile } from '../../users/userStore.js'
import { navigate, path } from '../../../router.js'
import LinkTreeLayout from './LinkTreeLayout.svelte'

const children = createRawSnippet(() => ({ render: () => '<p>konten halaman</p>' }))

beforeEach(() => {
  apiRequest.mockReset()
  apiRequest.mockResolvedValue({ data: { user: { id: 1, name: 'Feny' } } })
  profile.set(null)
  navigate('/', { replace: true })
})

describe('LinkTreeLayout (navbar + sidebar)', () => {
  it('membungkus navbar, sidebar, dan konten', () => {
    render(LinkTreeLayout, { children })
    expect(screen.getByRole('button', { name: 'Keluar' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Semua Link Tree' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pengguna' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Profil' })).toBeInTheDocument()
    expect(screen.getByText('konten halaman')).toBeInTheDocument()
  })

  it('memuat profil bila belum ada', async () => {
    render(LinkTreeLayout, { children })
    await waitFor(() => expect(get(profile)).toEqual({ id: 1, name: 'Feny' }))
    expect(apiRequest).toHaveBeenCalledWith('/users/me')
  })

  it('tidak memuat ulang profil bila sudah ada', () => {
    profile.set({ id: 9, name: 'Ada' })
    render(LinkTreeLayout, { children })
    expect(apiRequest).not.toHaveBeenCalled()
  })

  it('menelan galat saat memuat profil', async () => {
    apiRequest.mockRejectedValue(new Error('gagal'))
    render(LinkTreeLayout, { children })
    await waitFor(() => expect(apiRequest).toHaveBeenCalled())
    expect(screen.getByText('konten halaman')).toBeInTheDocument()
  })

  it('menandai menu aktif sesuai path', async () => {
    profile.set({ id: 1, name: 'x' })
    render(LinkTreeLayout, { children })
    const semua = screen.getByRole('link', { name: 'Semua Link Tree' })
    const pengguna = screen.getByRole('link', { name: 'Pengguna' })
    const profil = screen.getByRole('link', { name: 'Profil' })

    expect(semua).toHaveClass('active')
    expect(pengguna).not.toHaveClass('active')

    navigate('/link-trees/5')
    await waitFor(() => expect(semua).toHaveClass('active'))

    navigate('/users')
    await waitFor(() => expect(pengguna).toHaveClass('active'))
    expect(semua).not.toHaveClass('active')

    navigate('/profile')
    await waitFor(() => expect(profil).toHaveClass('active'))
  })

  it('klik menu berpindah halaman', async () => {
    profile.set({ id: 1, name: 'x' })
    render(LinkTreeLayout, { children })
    await userEvent.click(screen.getByRole('link', { name: 'Pengguna' }))
    expect(get(path)).toBe('/users')
    await userEvent.click(screen.getByRole('link', { name: 'Profil' }))
    expect(get(path)).toBe('/profile')
    await userEvent.click(screen.getByRole('link', { name: 'Semua Link Tree' }))
    expect(get(path)).toBe('/')
  })
})
