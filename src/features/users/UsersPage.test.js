import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/svelte'

vi.mock('../../lib/helpers/apiHelper.js', () => ({ apiRequest: vi.fn() }))

import { apiRequest } from '../../lib/helpers/apiHelper.js'
import { users } from './userStore.js'
import UsersPage from './UsersPage.svelte'

beforeEach(() => {
  apiRequest.mockReset()
  users.set([])
})

describe('UsersPage', () => {
  it('menampilkan status memuat', () => {
    apiRequest.mockReturnValue(new Promise(() => {}))
    render(UsersPage)
    expect(screen.getByText('Memuat data...')).toBeInTheDocument()
  })

  it('menampilkan daftar pengguna', async () => {
    apiRequest.mockResolvedValue({
      data: {
        users: [
          { id: 1, name: 'Ani', email: 'ani@x.co', photo: 'img/ani.png', created_at: '2026-01-05T00:00:00Z' },
          { id: 2, name: 'Budi', email: 'budi@x.co', photo: 'https://cdn.x/b.png', created_at: '2026-02-05T00:00:00Z' },
        ],
      },
    })
    render(UsersPage)
    expect(await screen.findByText('Ani')).toBeInTheDocument()
    expect(screen.getByText('budi@x.co')).toBeInTheDocument()
    expect(screen.getByAltText('Ani')).toHaveAttribute('src', 'https://open-api.delcom.org/img/ani.png')
    expect(screen.getByAltText('Budi')).toHaveAttribute('src', 'https://cdn.x/b.png')
    expect(screen.getByText(/Bergabung .*Januari 2026/)).toBeInTheDocument()
  })

  it('menampilkan pesan bila kosong', async () => {
    apiRequest.mockResolvedValue({ data: { users: [] } })
    render(UsersPage)
    expect(await screen.findByText('Belum ada pengguna.')).toBeInTheDocument()
  })

  it('menampilkan galat', async () => {
    apiRequest.mockRejectedValue(new Error('Tidak berwenang'))
    render(UsersPage)
    expect(await screen.findByText('Tidak berwenang')).toBeInTheDocument()
  })
})
