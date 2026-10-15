import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { get } from 'svelte/store'

vi.mock('../api/linkTreeApi.js', () => ({
  getLinkTrees: vi.fn(),
  deleteLinkTree: vi.fn(),
  deleteAllLinkTrees: vi.fn(),
  createLinkTree: vi.fn(),
}))

import * as api from '../api/linkTreeApi.js'
import { profile } from '../../users/userStore.js'
import { navigate, path } from '../../../router.js'
import HomePage from './HomePage.svelte'

const author = { name: 'Ani', photo: 'img/ani.png' }
const trees = [
  { id: 1, user_id: 1, title: 'Belajar Java', description: 'Kumpulan Java', type: 'public', cover: 'img/c1.png', total_links: 3, author },
  { id: 2, user_id: 2, title: 'Rahasia', description: null, type: 'private', cover: 'http://localhost:8000/', total_links: 2, author: { name: 'Budi', photo: '' } },
  { id: 3, user_id: 1, title: 'Tersembunyi', description: 'Tidak terdaftar', type: 'unlisted', cover: null, author },
  { id: 4, user_id: 3, title: 'Tanpa Penulis', description: 'x', type: 'public', cover: '', total_links: 1 },
]

let confirmSpy
beforeEach(() => {
  Object.values(api).forEach((f) => f.mockReset())
  api.getLinkTrees.mockResolvedValue(trees)
  profile.set({ id: 1, name: 'Feny' })
  confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
  navigate('/', { replace: true })
})

const open = async () => {
  render(HomePage)
  await screen.findByText('Belajar Java')
}
const stat = (label) => within(screen.getByText(label, { selector: '.stat span' }).parentElement).getByText(/^\d+$/)

describe('HomePage: daftar dan statistik', () => {
  it('menampilkan status memuat lalu seluruh link tree', async () => {
    render(HomePage)
    expect(screen.getByText('Memuat data...')).toBeInTheDocument()
    expect(await screen.findByText('Belajar Java')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Semua Link Tree' })).toBeInTheDocument()
    expect(screen.getByText('Tanpa deskripsi')).toBeInTheDocument()
    expect(screen.getByText('3 tautan')).toBeInTheDocument()
    expect(screen.getByText('0 tautan')).toBeInTheDocument()
    expect(screen.getByAltText('Belajar Java')).toHaveAttribute('src', 'https://open-api.delcom.org/img/c1.png')
  })

  it('menghitung statistik', async () => {
    await open()
    expect(stat('Total')).toHaveTextContent('4')
    expect(stat('Publik')).toHaveTextContent('2')
    expect(stat('Tidak Terdaftar')).toHaveTextContent('1')
    expect(stat('Privat')).toHaveTextContent('1')
    expect(stat('Total Tautan')).toHaveTextContent('6')
  })

  it('menampilkan galat pemuatan', async () => {
    api.getLinkTrees.mockRejectedValue(new Error('Server mati'))
    render(HomePage)
    expect(await screen.findByText('Server mati')).toBeInTheDocument()
  })

  it('menampilkan pesan kosong', async () => {
    api.getLinkTrees.mockResolvedValue([])
    render(HomePage)
    expect(await screen.findByText('Belum ada link tree.')).toBeInTheDocument()
  })

  it('klik kartu menuju detail', async () => {
    await open()
    const links = screen.getAllByRole('link', { name: 'Belajar Java' })
    expect(links).toHaveLength(2)
    await userEvent.click(links[1])
    expect(get(path)).toBe('/link-trees/1')
    navigate('/', { replace: true })
    await userEvent.click(screen.getByAltText('Belajar Java'))
    expect(get(path)).toBe('/link-trees/1')
  })
})

describe('HomePage: pencarian dan filter', () => {
  it('mencari berdasarkan judul, deskripsi, dan penulis', async () => {
    await open()
    const search = screen.getByPlaceholderText(/Cari judul/)
    await userEvent.type(search, 'java')
    expect(screen.getByText('Belajar Java')).toBeInTheDocument()
    expect(screen.queryByText('Rahasia')).not.toBeInTheDocument()

    await userEvent.clear(search)
    await userEvent.type(search, 'budi')
    expect(screen.getByText('Rahasia')).toBeInTheDocument()
    expect(screen.queryByText('Belajar Java')).not.toBeInTheDocument()

    await userEvent.clear(search)
    await userEvent.type(search, 'tidak terdaftar')
    expect(screen.getByText('Tersembunyi')).toBeInTheDocument()
  })

  it('menampilkan pesan bila tidak ada hasil', async () => {
    await open()
    await userEvent.type(screen.getByPlaceholderText(/Cari judul/), 'zzzz')
    expect(screen.getByText('Tidak ada hasil yang cocok.')).toBeInTheDocument()
  })

  it('filter "Milik saya" memuat ulang dengan is_me', async () => {
    await open()
    await userEvent.click(screen.getByLabelText('Milik saya'))
    await waitFor(() => expect(api.getLinkTrees).toHaveBeenLastCalledWith({ isMe: true }))
  })

  it('pesan kosong khusus untuk filter milik saya', async () => {
    await open()
    api.getLinkTrees.mockResolvedValue([])
    await userEvent.click(screen.getByLabelText('Milik saya'))
    expect(await screen.findByText('Kamu belum punya link tree.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Hapus Semua/ })).not.toBeInTheDocument()
  })
})

describe('HomePage: tambah', () => {
  it('membuka dan menutup modal tambah', async () => {
    await open()
    await userEvent.click(screen.getByRole('button', { name: '+ Tambah Link Tree' }))
    expect(screen.getByRole('dialog', { name: 'Tambah Link Tree' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Batal' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('HomePage: hapus', () => {
  it('tombol hapus hanya untuk pemilik', async () => {
    await open()
    expect(screen.getAllByRole('button', { name: 'Hapus' })).toHaveLength(2)
  })

  it('tanpa profil tidak ada tombol hapus', async () => {
    profile.set(null)
    await open()
    expect(screen.queryByRole('button', { name: 'Hapus' })).not.toBeInTheDocument()
  })

  it('batal konfirmasi tidak menghapus', async () => {
    confirmSpy.mockReturnValue(false)
    await open()
    await userEvent.click(screen.getAllByRole('button', { name: 'Hapus' })[0])
    expect(api.deleteLinkTree).not.toHaveBeenCalled()
  })

  it('menghapus satu link tree', async () => {
    api.deleteLinkTree.mockResolvedValue()
    await open()
    await userEvent.click(screen.getAllByRole('button', { name: 'Hapus' })[0])
    await waitFor(() => expect(screen.queryByText('Belajar Java')).not.toBeInTheDocument())
    expect(api.deleteLinkTree).toHaveBeenCalledWith(1)
  })

  it('menampilkan galat hapus', async () => {
    api.deleteLinkTree.mockRejectedValue(new Error('Tidak boleh'))
    await open()
    await userEvent.click(screen.getAllByRole('button', { name: 'Hapus' })[0])
    expect(await screen.findByText('Tidak boleh')).toBeInTheDocument()
  })
})

describe('HomePage: hapus semua', () => {
  const enableMine = async () => {
    await open()
    await userEvent.click(screen.getByLabelText('Milik saya'))
    return screen.findByRole('button', { name: 'Hapus Semua Milik Saya' })
  }

  it('batal konfirmasi tidak menghapus', async () => {
    const btn = await enableMine()
    confirmSpy.mockReturnValue(false)
    await userEvent.click(btn)
    expect(api.deleteAllLinkTrees).not.toHaveBeenCalled()
  })

  it('menghapus semua lalu memuat ulang', async () => {
    api.deleteAllLinkTrees.mockResolvedValue()
    const btn = await enableMine()
    const callsBefore = api.getLinkTrees.mock.calls.length
    await userEvent.click(btn)
    await waitFor(() => expect(api.getLinkTrees.mock.calls.length).toBeGreaterThan(callsBefore))
    expect(api.deleteAllLinkTrees).toHaveBeenCalled()
  })

  it('menampilkan status menghapus dan galatnya', async () => {
    let fail
    api.deleteAllLinkTrees.mockReturnValue(new Promise((_, r) => (fail = r)))
    const btn = await enableMine()
    await userEvent.click(btn)
    expect(await screen.findByRole('button', { name: 'Menghapus...' })).toBeDisabled()
    fail(new Error('Gagal hapus semua'))
    expect(await screen.findByText('Gagal hapus semua')).toBeInTheDocument()
  })
})
