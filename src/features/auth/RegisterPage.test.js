import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { get } from 'svelte/store'

vi.mock('./authStore.js', () => ({ register: vi.fn() }))

import { register } from './authStore.js'
import { navigate, path } from '../../router.js'
import RegisterPage from './RegisterPage.svelte'

let user
async function fill({ name, email, password }) {
  if (name) await user.type(screen.getByLabelText('Nama'), name)
  if (email) await user.type(screen.getByLabelText('Email'), email)
  if (password) await user.type(screen.getByLabelText('Password'), password)
}
const submit = () => user.click(screen.getByRole('button', { name: 'Daftar' }))

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
  register.mockReset()
  navigate('/auth/register', { replace: true })
})
afterEach(() => vi.useRealTimers())

describe('RegisterPage', () => {
  it('menampilkan form di dalam layout autentikasi', () => {
    render(RegisterPage)
    expect(screen.getByRole('heading', { level: 2, name: 'Daftar' })).toBeInTheDocument()
    expect(screen.getByText(/Kumpulkan semua tautan/)).toBeInTheDocument()
  })

  it('menolak nama kosong', async () => {
    render(RegisterPage)
    await fill({ email: 'a@b.co', password: 'rahasia' })
    await submit()
    expect(screen.getByText('Nama wajib diisi')).toBeInTheDocument()
  })

  it('menolak email tidak valid', async () => {
    render(RegisterPage)
    await fill({ name: 'Feny', email: 'a@b', password: 'rahasia' })
    await submit()
    expect(screen.getByText('Format email tidak valid')).toBeInTheDocument()
  })

  it('menolak password pendek', async () => {
    render(RegisterPage)
    await fill({ name: 'Feny', email: 'a@b.co', password: '123' })
    await submit()
    expect(screen.getByText('Password minimal 6 karakter')).toBeInTheDocument()
    expect(register).not.toHaveBeenCalled()
  })

  it('berhasil mendaftar lalu menuju halaman masuk', async () => {
    register.mockResolvedValue()
    render(RegisterPage)
    await fill({ name: '  Feny  ', email: 'a@b.co', password: 'rahasia' })
    await submit()
    expect(await screen.findByText(/Registrasi berhasil/)).toBeInTheDocument()
    expect(register).toHaveBeenCalledWith({ name: 'Feny', email: 'a@b.co', password: 'rahasia' })
    await vi.advanceTimersByTimeAsync(1300)
    expect(get(path)).toBe('/auth/login')
  })

  it('menampilkan galat dari server', async () => {
    register.mockRejectedValue(new Error('Email sudah dipakai'))
    render(RegisterPage)
    await fill({ name: 'Feny', email: 'a@b.co', password: 'rahasia' })
    await submit()
    expect(await screen.findByText('Email sudah dipakai')).toBeInTheDocument()
  })

  it('menonaktifkan tombol saat memproses', async () => {
    let resolve
    register.mockReturnValue(new Promise((r) => (resolve = r)))
    render(RegisterPage)
    await fill({ name: 'Feny', email: 'a@b.co', password: 'rahasia' })
    await submit()
    expect(await screen.findByRole('button', { name: 'Memproses...' })).toBeDisabled()
    resolve()
  })

  it('tautan Masuk menuju halaman masuk', async () => {
    render(RegisterPage)
    await user.click(screen.getByRole('link', { name: 'Masuk' }))
    expect(get(path)).toBe('/auth/login')
  })
})
