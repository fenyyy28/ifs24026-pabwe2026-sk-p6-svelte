import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { get } from 'svelte/store'

import App from './App.svelte'
import { navigate, path } from './router.js'
import { token } from './features/auth/authStore.js'
import { profile } from './features/users/userStore.js'

const me = { id: 1, name: 'Feny', email: 'feny@x.co', photo: '' }
const tree = { id: 1, user_id: 1, title: 'Belajar Java', description: 'd', type: 'public', cover: '', author: me, items: [] }

function payload(url) {
  if (url.endsWith('/users/me')) return { data: { user: me } }
  if (url.endsWith('/users')) return { data: { users: [me] } }
  if (url.endsWith('/link-trees/1')) return { data: { link_tree: tree } }
  if (url.includes('/link-trees')) return { data: { link_trees: [tree] } }
  return { data: {} }
}

function login() {
  localStorage.setItem('token', 'abc')
  token.set('abc')
}

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn(async (url) => ({ ok: true, status: 200, json: async () => payload(url) })))
  token.set(null)
  profile.set(null)
})
afterEach(() => vi.unstubAllGlobals())

function openAt(pathname) {
  navigate(pathname, { replace: true })
  return render(App)
}

describe('App: tamu', () => {
  it.each(['/', '/users', '/profile', '/link-trees/1'])('%s dialihkan ke halaman masuk', async (p) => {
    openAt(p)
    expect(await screen.findByRole('heading', { level: 2, name: 'Masuk' })).toBeInTheDocument()
    expect(get(path)).toBe('/auth/login')
  })

  it('/auth/login memakai layout autentikasi', async () => {
    openAt('/auth/login')
    expect(await screen.findByRole('heading', { level: 2, name: 'Masuk' })).toBeInTheDocument()
    expect(screen.getByText(/Kumpulkan semua tautan/)).toBeInTheDocument()
  })

  it('/auth/register menampilkan form daftar', async () => {
    openAt('/auth/register')
    expect(await screen.findByRole('heading', { level: 2, name: 'Daftar' })).toBeInTheDocument()
  })

  it('path tidak dikenal menampilkan 404', async () => {
    openAt('/ngawur')
    expect(await screen.findByRole('heading', { name: '404' })).toBeInTheDocument()
    expect(get(path)).toBe('/ngawur')
  })

  it('/login (path lama) menampilkan 404', async () => {
    openAt('/login')
    expect(await screen.findByRole('heading', { name: '404' })).toBeInTheDocument()
  })
})

describe('App: pengguna login', () => {
  beforeEach(login)

  it('/ menampilkan daftar link tree dalam layout aplikasi', async () => {
    openAt('/')
    expect(await screen.findByText('Belajar Java')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Semua Link Tree' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Pengguna' })).toBeInTheDocument()
    expect(await within(screen.getByRole('banner')).findByText('Feny')).toBeInTheDocument()
  })

  it('/link-trees/:id menampilkan detail', async () => {
    openAt('/link-trees/1')
    expect(await screen.findByRole('heading', { level: 1, name: 'Belajar Java' })).toBeInTheDocument()
  })

  it('/users menampilkan daftar pengguna', async () => {
    openAt('/users')
    expect(await screen.findByRole('heading', { level: 1, name: 'Pengguna' })).toBeInTheDocument()
  })

  it('/profile menampilkan profil', async () => {
    openAt('/profile')
    expect(await screen.findByRole('heading', { level: 1, name: 'Profil Saya' })).toBeInTheDocument()
  })

  it('halaman tamu dialihkan ke beranda', async () => {
    openAt('/auth/login')
    expect(await screen.findByRole('heading', { level: 1, name: 'Semua Link Tree' })).toBeInTheDocument()
    expect(get(path)).toBe('/')
  })

  it('404 untuk path tidak dikenal', async () => {
    openAt('/ngawur')
    expect(await screen.findByRole('heading', { name: '404' })).toBeInTheDocument()
  })

  it('navigasi lewat sidebar berpindah halaman', async () => {
    openAt('/')
    await screen.findByText('Belajar Java')
    await userEvent.click(screen.getByRole('link', { name: 'Pengguna' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Pengguna' })).toBeInTheDocument()
  })

  it('Keluar mengembalikan ke halaman masuk', async () => {
    openAt('/')
    await screen.findByText('Belajar Java')
    await userEvent.click(screen.getByRole('button', { name: 'Keluar' }))
    expect(await screen.findByRole('heading', { level: 2, name: 'Masuk' })).toBeInTheDocument()
    await waitFor(() => expect(get(path)).toBe('/auth/login'))
  })
})
