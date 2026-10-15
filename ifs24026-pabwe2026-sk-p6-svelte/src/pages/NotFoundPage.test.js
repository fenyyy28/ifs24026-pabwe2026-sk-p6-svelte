import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { get } from 'svelte/store'
import NotFoundPage from './NotFoundPage.svelte'
import { token } from '../features/auth/authStore.js'
import { navigate, path } from '../router.js'

beforeEach(() => {
  token.set(null)
  navigate('/ngawur', { replace: true })
})

describe('NotFoundPage', () => {
  it('menampilkan 404 dan alamat yang dibuka', () => {
    render(NotFoundPage)
    expect(screen.getByRole('heading', { name: '404' })).toBeInTheDocument()
    expect(screen.getByText('Halaman tidak ditemukan')).toBeInTheDocument()
    expect(screen.getByText('/ngawur')).toBeInTheDocument()
  })

  it('tamu diarahkan kembali ke halaman masuk', async () => {
    render(NotFoundPage)
    const link = screen.getByRole('link', { name: 'Kembali ke halaman masuk' })
    expect(link).toHaveAttribute('href', '/auth/login')
    await userEvent.click(link)
    expect(get(path)).toBe('/auth/login')
  })

  it('pengguna login diarahkan ke beranda', async () => {
    token.set('abc')
    render(NotFoundPage)
    const link = screen.getByRole('link', { name: 'Kembali ke Semua Link Tree' })
    expect(link).toHaveAttribute('href', '/')
    await userEvent.click(link)
    expect(get(path)).toBe('/')
  })
})
