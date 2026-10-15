import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { get } from 'svelte/store'
import Navbar from './Navbar.svelte'
import { profile } from '../../features/users/userStore.js'
import { token } from '../../features/auth/authStore.js'
import { navigate, path } from '../../router.js'

beforeEach(() => {
  profile.set(null)
  navigate('/users', { replace: true })
})

describe('Navbar', () => {
  it('menampilkan merek dan tombol keluar tanpa nama pengguna', () => {
    render(Navbar)
    expect(screen.getByText('Delcom Link Tree')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Keluar' })).toBeInTheDocument()
    expect(screen.queryByText('Feny')).not.toBeInTheDocument()
  })

  it('menampilkan nama pengguna bila profil ada', () => {
    profile.set({ id: 1, name: 'Feny' })
    render(Navbar)
    expect(screen.getByText('Feny')).toBeInTheDocument()
  })

  it('klik merek menuju beranda', async () => {
    render(Navbar)
    await userEvent.click(screen.getByRole('link', { name: /Delcom Link Tree/ }))
    expect(get(path)).toBe('/')
  })

  it('Keluar menghapus sesi', async () => {
    localStorage.setItem('token', 'abc')
    token.set('abc')
    profile.set({ id: 1, name: 'Feny' })
    render(Navbar)
    await userEvent.click(screen.getByRole('button', { name: 'Keluar' }))
    expect(localStorage.getItem('token')).toBeNull()
    expect(get(token)).toBeNull()
    expect(get(profile)).toBeNull()
  })
})
