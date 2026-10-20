import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { get } from 'svelte/store'

vi.mock('../api/linkTreeApi.js', () => ({
  getLinkTree: vi.fn(),
  deleteLinkTree: vi.fn(),
  deleteItem: vi.fn(),
  updateLinkTree: vi.fn(),
  changeCover: vi.fn(),
  addItem: vi.fn(),
  updateItem: vi.fn(),
}))

import * as api from '../api/linkTreeApi.js'
import { profile } from '../../users/userStore.js'
import { navigate, path } from '../../../router.js'
import DetailPage from './DetailPage.svelte'

const tree = {
  id: 5,
  user_id: 1,
  title: 'Belajar Java',
  description: 'Kumpulan Java',
  type: 'public',
  cover: 'img/c.png',
  created_at: '2026-03-10T00:00:00Z',
  author: { name: 'Ani', photo: 'img/ani.png' },
  items: [
    { id: 11, title: 'Dasar', url: 'https://a.id' },
    { id: 12, title: 'Lanjut', url: 'https://b.id' },
  ],
}

let confirmSpy
beforeEach(() => {
  Object.values(api).forEach((f) => f.mockReset())
  api.getLinkTree.mockResolvedValue(tree)
  profile.set({ id: 1, name: 'Feny' })
  confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
  navigate('/link-trees/5', { replace: true })
})

const treeDelete = () => within(document.querySelector('.owner-actions')).getByRole('button', { name: /Hapus|Menghapus/ })

const open = async (props = { linkTreeId: '5' }) => {
  const view = render(DetailPage, props)
  await waitFor(() => expect(screen.queryByText('Memuat data...')).not.toBeInTheDocument())
  return view
}

describe('DetailPage: tampilan', () => {
  it('memuat detail dengan sampul, tipe, penulis, dan tautan', async () => {
    render(DetailPage, { linkTreeId: '5' })
    expect(screen.getByText('Memuat data...')).toBeInTheDocument()
    expect(await screen.findByRole('heading', { level: 1, name: 'Belajar Java' })).toBeInTheDocument()
    expect(api.getLinkTree).toHaveBeenCalledWith('5')
    expect(screen.getByAltText('Belajar Java')).toHaveAttribute('src', 'https://open-api.delcom.org/img/c.png')
    expect(screen.getByText('Publik')).toBeInTheDocument()
    expect(screen.getByText('Ani')).toBeInTheDocument()
    expect(screen.getByText(/Dibuat .*Maret 2026/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tautan (2)' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Dasar/ })).toHaveAttribute('href', 'https://a.id')
  })

  it('tanpa sampul, tanpa deskripsi, tanpa daftar item', async () => {
    api.getLinkTree.mockResolvedValue({ ...tree, cover: '', description: '', items: undefined })
    await open()
    expect(screen.queryByAltText('Belajar Java')).not.toBeInTheDocument()
    expect(screen.getByText('Tanpa deskripsi')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Tautan (0)' })).toBeInTheDocument()
    expect(screen.getByText('Belum ada tautan.')).toBeInTheDocument()
  })

  it('item berupa larik kosong', async () => {
    api.getLinkTree.mockResolvedValue({ ...tree, items: [] })
    await open()
    expect(screen.getByText('Belum ada tautan.')).toBeInTheDocument()
  })

  it('menampilkan galat pemuatan', async () => {
    api.getLinkTree.mockRejectedValue(new Error('Tidak ditemukan'))
    render(DetailPage, { linkTreeId: '5' })
    expect(await screen.findByText('Tidak ditemukan')).toBeInTheDocument()
  })

  it('tidak menampilkan data milik id lain', async () => {
    api.getLinkTree.mockResolvedValue({ ...tree, id: 99 })
    render(DetailPage, { linkTreeId: '5' })
    await waitFor(() => expect(api.getLinkTree).toHaveBeenCalled())
    await waitFor(() => expect(screen.queryByText('Memuat data...')).not.toBeInTheDocument())
    expect(screen.queryByText('Belajar Java')).not.toBeInTheDocument()
  })

  it('memuat ulang saat id berubah', async () => {
    const { rerender } = await open()
    api.getLinkTree.mockResolvedValue({ ...tree, id: 6, title: 'Lainnya' })
    await rerender({ linkTreeId: '6' })
    expect(await screen.findByRole('heading', { level: 1, name: 'Lainnya' })).toBeInTheDocument()
    expect(api.getLinkTree).toHaveBeenLastCalledWith('6')
  })

  it('tautan kembali menuju beranda', async () => {
    await open()
    await userEvent.click(screen.getByRole('link', { name: /Semua Link Tree/ }))
    expect(get(path)).toBe('/')
  })
})

describe('DetailPage: hak akses', () => {
  it('pemilik melihat seluruh aksi', async () => {
    await open()
    for (const name of ['Ubah Data', 'Ubah Sampul', '+ Tambah Tautan']) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument()
    }
    expect(treeDelete()).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Ubah' })).toHaveLength(2)
  })

  it('bukan pemilik tidak melihat aksi', async () => {
    profile.set({ id: 2, name: 'Lain' })
    await open()
    expect(screen.queryByRole('button', { name: 'Ubah Data' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '+ Tambah Tautan' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ubah' })).not.toBeInTheDocument()
  })

  it('tanpa profil tidak ada aksi', async () => {
    profile.set(null)
    await open()
    expect(screen.queryByRole('button', { name: 'Ubah Data' })).not.toBeInTheDocument()
  })
})

describe('DetailPage: modal', () => {
  it('membuka dan menutup modal ubah data', async () => {
    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Ubah Data' }))
    expect(screen.getByRole('dialog', { name: 'Ubah Link Tree' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Batal' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('membuka modal ubah sampul', async () => {
    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Ubah Sampul' }))
    expect(screen.getByRole('dialog', { name: 'Ubah Sampul' })).toBeInTheDocument()
  })

  it('modal tambah tautan kosong, lalu ubah tautan terisi', async () => {
    await open()
    await userEvent.click(screen.getByRole('button', { name: '+ Tambah Tautan' }))
    expect(screen.getByLabelText('Judul')).toHaveValue('')
    await userEvent.click(screen.getByRole('button', { name: 'Batal' }))

    await userEvent.click(screen.getAllByRole('button', { name: 'Ubah' })[1])
    expect(screen.getByRole('dialog', { name: 'Ubah Tautan' })).toBeInTheDocument()
    expect(screen.getByLabelText('Judul')).toHaveValue('Lanjut')
    await userEvent.click(screen.getByRole('button', { name: 'Batal' }))

    await userEvent.click(screen.getByRole('button', { name: '+ Tambah Tautan' }))
    expect(screen.getByLabelText('Judul')).toHaveValue('')
  })
})

describe('DetailPage: tambah dan ubah tautan lewat modal', () => {
  it('menambah tautan ke link tree yang sedang dibuka', async () => {
    api.addItem.mockResolvedValue(30)
    await open()
    await userEvent.click(screen.getByRole('button', { name: '+ Tambah Tautan' }))
    await userEvent.type(screen.getByLabelText('Judul'), 'Baru')
    await userEvent.type(screen.getByLabelText('URL'), 'https://baru.id')
    await userEvent.click(screen.getByRole('button', { name: 'Simpan' }))
    await waitFor(() => expect(api.addItem).toHaveBeenCalledWith(5, { title: 'Baru', url: 'https://baru.id' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('mengubah tautan yang dipilih', async () => {
    api.updateItem.mockResolvedValue()
    await open()
    await userEvent.click(screen.getAllByRole('button', { name: 'Ubah' })[0])
    await userEvent.click(screen.getByRole('button', { name: 'Simpan' }))
    await waitFor(() => expect(api.updateItem).toHaveBeenCalledWith(5, 11, { title: 'Dasar', url: 'https://a.id' }))
  })

  it('mengubah data dan sampul lewat modal', async () => {
    api.updateLinkTree.mockResolvedValue()
    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Ubah Data' }))
    await userEvent.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))
    await waitFor(() => expect(api.updateLinkTree).toHaveBeenCalledWith(5, expect.objectContaining({ title: 'Belajar Java' })))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})

describe('DetailPage: hapus link tree', () => {
  it('batal konfirmasi', async () => {
    confirmSpy.mockReturnValue(false)
    await open()
    await userEvent.click(treeDelete())
    expect(api.deleteLinkTree).not.toHaveBeenCalled()
  })

  it('menghapus lalu menuju beranda', async () => {
    api.deleteLinkTree.mockResolvedValue()
    await open()
    await userEvent.click(treeDelete())
    await waitFor(() => expect(get(path)).toBe('/'))
    expect(api.deleteLinkTree).toHaveBeenCalledWith(5)
  })

  it('menampilkan status menghapus dan galatnya', async () => {
    let fail
    api.deleteLinkTree.mockReturnValue(new Promise((_, r) => (fail = r)))
    await open()
    await userEvent.click(treeDelete())
    expect(await screen.findByRole('button', { name: 'Menghapus...' })).toBeDisabled()
    fail(new Error('Gagal hapus'))
    expect(await screen.findByText('Gagal hapus')).toBeInTheDocument()
  })
})

describe('DetailPage: hapus tautan', () => {
  const rowButton = (title) =>
    within(screen.getByText(title).closest('li')).getByRole('button', { name: 'Hapus' })

  it('batal konfirmasi', async () => {
    confirmSpy.mockReturnValue(false)
    await open()
    await userEvent.click(rowButton('Dasar'))
    expect(api.deleteItem).not.toHaveBeenCalled()
  })

  it('menghapus tautan dan memuat ulang', async () => {
    api.deleteItem.mockResolvedValue()
    await open()
    await userEvent.click(rowButton('Dasar'))
    await waitFor(() => expect(api.deleteItem).toHaveBeenCalledWith(5, 11))
    expect(api.getLinkTree).toHaveBeenCalledTimes(2)
  })

  it('menampilkan galat', async () => {
    api.deleteItem.mockRejectedValue(new Error('Gagal hapus tautan'))
    await open()
    await userEvent.click(rowButton('Dasar'))
    expect(await screen.findByText('Gagal hapus tautan')).toBeInTheDocument()
  })
})
