import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { get } from 'svelte/store'

vi.mock('./authStore.js', () => ({ login: vi.fn() }))

import { login } from './authStore.js'
import { navigate, path } from '../../router.js'
import LoginPage from './LoginPage.svelte'

async function fill(email, password) {
  if (email) await userEvent.type(screen.getByLabelText('Email'), email)
  if (password) await userEvent.type(screen.getByLabelText('Password'), password)
}
const submit = () => userEvent.click(screen.getByRole('button', { name: 'Masuk' }))

beforeEach(() => {
  login.mockReset()
  navigate('/auth/login', { replace: true })
})

describe('LoginPage', () => {
  it('menampilkan form di dalam layout autentikasi', () => {
    render(LoginPage)
    expect(screen.getByRole('heading', { level: 2, name: 'Masuk' })).toBeInTheDocument()
    expect(screen.getByText(/Kumpulkan semua tautan/)).toBeInTheDocument()
  })

  it('menolak email tidak valid', async () => {
    render(LoginPage)
    await fill('a@b', 'rahasia')
    await submit()
    expect(screen.getByText('Format email tidak valid')).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })

  it('menolak password kosong', async () => {
    render(LoginPage)
    await fill('a@b.co')
    await submit()
    expect(screen.getByText('Password wajib diisi')).toBeInTheDocument()
    expect(login).not.toHaveBeenCalled()
  })

  it('berhasil login lalu menuju beranda', async () => {
    login.mockResolvedValue()
    render(LoginPage)
    await fill('a@b.co', 'rahasia')
    await submit()
    await waitFor(() => expect(get(path)).toBe('/'))
    expect(login).toHaveBeenCalledWith({ email: 'a@b.co', password: 'rahasia' })
  })

  it('menampilkan galat dari server dan menghapusnya saat kirim ulang', async () => {
    login.mockRejectedValue(new Error('Kredensial salah'))
    render(LoginPage)
    await fill('a@b.co', 'rahasia')
    await submit()
    expect(await screen.findByText('Kredensial salah')).toBeInTheDocument()
    login.mockResolvedValue()
    await submit()
    await waitFor(() => expect(screen.queryByText('Kredensial salah')).not.toBeInTheDocument())
  })

  it('menonaktifkan tombol saat memproses', async () => {
    let resolve
    login.mockReturnValue(new Promise((r) => (resolve = r)))
    render(LoginPage)
    await fill('a@b.co', 'rahasia')
    await submit()
    const busy = await screen.findByRole('button', { name: 'Memproses...' })
    expect(busy).toBeDisabled()
    resolve()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Masuk' })).toBeEnabled())
  })

  it('tautan Daftar menuju halaman registrasi', async () => {
    render(LoginPage)
    await userEvent.click(screen.getByRole('link', { name: 'Daftar' }))
    expect(get(path)).toBe('/auth/register')
  })
})
