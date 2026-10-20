import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'

vi.mock('../../lib/helpers/apiHelper.js', () => ({ apiRequest: vi.fn() }))

import { apiRequest } from '../../lib/helpers/apiHelper.js'
import { profile } from './userStore.js'
import ProfilePage from './ProfilePage.svelte'

const me = { id: 1, name: 'Feny', email: 'feny@x.co', photo: 'img/feny.png' }
const user = userEvent.setup({ applyAccept: false })

// permintaan GET /users/me selalu dijawab dengan data terbaru
function api(handler = () => ({})) {
  apiRequest.mockImplementation(async (path, opts = {}) => {
    if (path === '/users/me' && !opts.method) return { data: { user: me } }
    return handler(path, opts)
  })
}

beforeEach(() => {
  apiRequest.mockReset()
  profile.set(null)
})

async function ready() {
  render(ProfilePage)
  await screen.findByDisplayValue('Feny')
}

describe('ProfilePage: pemuatan', () => {
  it('menampilkan status memuat lalu mengisi form', async () => {
    api()
    render(ProfilePage)
    expect(screen.getByText('Memuat data...')).toBeInTheDocument()
    expect(await screen.findByDisplayValue('Feny')).toBeInTheDocument()
    expect(screen.getByDisplayValue('feny@x.co')).toBeInTheDocument()
    expect(screen.getByAltText('Foto profil')).toHaveAttribute('src', 'https://open-api.delcom.org/img/feny.png')
  })

  it('menampilkan galat pemuatan', async () => {
    apiRequest.mockRejectedValue(new Error('Gagal memuat'))
    render(ProfilePage)
    expect(await screen.findByText('Gagal memuat')).toBeInTheDocument()
  })
})

describe('ProfilePage: data profil', () => {
  it('menolak nama kosong dan email tidak valid', async () => {
    api()
    await ready()
    const name = screen.getByLabelText('Nama')
    await user.clear(name)
    await user.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))
    expect(screen.getByText('Nama wajib diisi')).toBeInTheDocument()

    await user.type(name, 'Feny')
    const email = screen.getByLabelText('Email')
    await user.clear(email)
    await user.type(email, 'a@b')
    await user.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))
    expect(screen.getByText('Format email tidak valid')).toBeInTheDocument()
  })

  it('berhasil menyimpan', async () => {
    api((path, opts) => ({ data: { user: { ...me, name: 'Baru' } } }))
    await ready()
    const name = screen.getByLabelText('Nama')
    await user.clear(name)
    await user.type(name, '  Baru ')
    await user.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))
    expect(await screen.findByText('Profil berhasil diperbarui')).toBeInTheDocument()
    expect(apiRequest).toHaveBeenCalledWith('/users/me', {
      method: 'PUT',
      body: { name: 'Baru', email: 'feny@x.co' },
    })
  })

  it('menampilkan galat dari server dan status menyimpan', async () => {
    let reject
    api(() => new Promise((_, r) => (reject = r)))
    await ready()
    await user.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))
    expect(await screen.findByRole('button', { name: 'Menyimpan...' })).toBeDisabled()
    reject(new Error('Email dipakai'))
    expect(await screen.findByText('Email dipakai')).toBeInTheDocument()
  })
})

describe('ProfilePage: foto', () => {
  const input = () => document.querySelector('input[type="file"]')

  it('mengabaikan jika tidak ada file dipilih', async () => {
    api()
    await ready()
    await fireEvent.change(input())
    expect(apiRequest).toHaveBeenCalledTimes(1)
  })

  it('menolak file non-gambar', async () => {
    api()
    await ready()
    await user.upload(input(), new File(['x'], 'a.txt', { type: 'text/plain' }))
    expect(await screen.findByText('File harus berupa gambar')).toBeInTheDocument()
  })

  it('berhasil mengunggah dan menampilkan status mengunggah', async () => {
    let finish
    api((path) => (path === '/users/me/photo' ? new Promise((r) => (finish = r)) : {}))
    await ready()
    await user.upload(input(), new File(['x'], 'a.png', { type: 'image/png' }))
    expect(await screen.findByText('Mengunggah...')).toBeInTheDocument()
    finish({})
    expect(await screen.findByText('Foto profil berhasil diubah')).toBeInTheDocument()
    expect(screen.queryByText('Mengunggah...')).not.toBeInTheDocument()
  })

  it('menampilkan galat unggah', async () => {
    api((path) => {
      if (path === '/users/me/photo') throw new Error('Terlalu besar')
      return {}
    })
    await ready()
    await user.upload(input(), new File(['x'], 'a.png', { type: 'image/png' }))
    expect(await screen.findByText('Terlalu besar')).toBeInTheDocument()
  })
})

describe('ProfilePage: kata sandi', () => {
  async function fillPassword({ current = '', next = '', confirm = '' }) {
    if (current) await user.type(screen.getByLabelText('Kata sandi saat ini'), current)
    if (next) await user.type(screen.getByLabelText('Kata sandi baru'), next)
    if (confirm) await user.type(screen.getByLabelText('Konfirmasi kata sandi baru'), confirm)
    await user.click(screen.getByRole('button', { name: 'Ubah Kata Sandi' }))
  }

  it('validasi tiap kondisi', async () => {
    api()
    await ready()
    await fillPassword({})
    expect(screen.getByText('Kata sandi saat ini wajib diisi')).toBeInTheDocument()

    await fillPassword({ current: 'lama', next: '123' })
    expect(screen.getByText('Kata sandi baru minimal 6 karakter')).toBeInTheDocument()

    await user.clear(screen.getByLabelText('Kata sandi baru'))
    await fillPassword({ next: 'baru123', confirm: 'beda' })
    expect(screen.getByText('Konfirmasi kata sandi tidak sama')).toBeInTheDocument()
  })

  it('berhasil mengubah dan mengosongkan kolom', async () => {
    api()
    await ready()
    await fillPassword({ current: 'lama', next: 'baru123', confirm: 'baru123' })
    expect(await screen.findByText('Kata sandi berhasil diubah')).toBeInTheDocument()
    expect(apiRequest).toHaveBeenCalledWith('/users/password', {
      method: 'PUT',
      body: { password: 'lama', new_password: 'baru123', new_password_confirmation: 'baru123' },
    })
    expect(screen.getByLabelText('Kata sandi saat ini')).toHaveValue('')
  })

  it('menampilkan galat dan status menyimpan', async () => {
    let reject
    api((path) => (path === '/users/password' ? new Promise((_, r) => (reject = r)) : {}))
    await ready()
    await fillPassword({ current: 'lama', next: 'baru123', confirm: 'baru123' })
    expect(await screen.findByRole('button', { name: 'Menyimpan...' })).toBeDisabled()
    reject(new Error('Kata sandi lama salah'))
    expect(await screen.findByText('Kata sandi lama salah')).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Ubah Kata Sandi' })).toBeEnabled())
  })
})
