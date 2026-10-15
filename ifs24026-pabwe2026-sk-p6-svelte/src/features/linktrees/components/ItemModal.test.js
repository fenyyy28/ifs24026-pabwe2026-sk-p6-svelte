import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'

vi.mock('../api/linkTreeApi.js', () => ({
  addItem: vi.fn(),
  updateItem: vi.fn(),
  getLinkTree: vi.fn(),
}))

import { addItem, updateItem, getLinkTree } from '../api/linkTreeApi.js'
import ItemModal from './ItemModal.svelte'

let onclose
const item = { id: 8, title: 'Java', url: 'https://java.com' }
const open = (props = {}) => render(ItemModal, { linkTreeId: 4, onclose, ...props })
const submit = () => userEvent.click(screen.getByRole('button', { name: 'Simpan' }))

beforeEach(() => {
  addItem.mockReset()
  updateItem.mockReset()
  getLinkTree.mockReset()
  getLinkTree.mockResolvedValue({ id: 4 })
  onclose = vi.fn()
})

describe('ItemModal: tambah', () => {
  it('judul modal dan form kosong', () => {
    open()
    expect(screen.getByRole('dialog', { name: 'Tambah Tautan' })).toBeInTheDocument()
    expect(screen.getByLabelText('Judul')).toHaveValue('')
    expect(screen.getByLabelText('URL')).toHaveValue('')
  })

  it('menolak judul kosong dan URL tidak valid', async () => {
    open()
    await submit()
    expect(screen.getByText('Judul tautan wajib diisi')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Judul'), 'Java')
    await userEvent.type(screen.getByLabelText('URL'), 'bukan url')
    await submit()
    expect(screen.getByText(/URL tidak valid/)).toBeInTheDocument()
    expect(addItem).not.toHaveBeenCalled()
  })

  it('menambah tautan lalu menutup', async () => {
    addItem.mockResolvedValue(1)
    open()
    await userEvent.type(screen.getByLabelText('Judul'), ' Java ')
    await userEvent.type(screen.getByLabelText('URL'), ' https://java.com ')
    await submit()
    await waitFor(() => expect(onclose).toHaveBeenCalled())
    expect(addItem).toHaveBeenCalledWith(4, { title: 'Java', url: 'https://java.com' })
  })

  it('menampilkan galat dan status menyimpan', async () => {
    let fail
    addItem.mockReturnValue(new Promise((_, r) => (fail = r)))
    open()
    await userEvent.type(screen.getByLabelText('Judul'), 'Java')
    await userEvent.type(screen.getByLabelText('URL'), 'https://java.com')
    await submit()
    expect(await screen.findByRole('button', { name: 'Menyimpan...' })).toBeDisabled()
    fail(new Error('Gagal tambah'))
    expect(await screen.findByText('Gagal tambah')).toBeInTheDocument()
  })

  it('Batal menutup', async () => {
    open()
    await userEvent.click(screen.getByRole('button', { name: 'Batal' }))
    expect(onclose).toHaveBeenCalled()
  })
})

describe('ItemModal: ubah', () => {
  it('terisi data tautan', () => {
    open({ item })
    expect(screen.getByRole('dialog', { name: 'Ubah Tautan' })).toBeInTheDocument()
    expect(screen.getByLabelText('Judul')).toHaveValue('Java')
    expect(screen.getByLabelText('URL')).toHaveValue('https://java.com')
  })

  it('menyimpan perubahan lewat updateItem', async () => {
    updateItem.mockResolvedValue()
    open({ item })
    const title = screen.getByLabelText('Judul')
    await userEvent.clear(title)
    await userEvent.type(title, 'Kotlin')
    await submit()
    await waitFor(() => expect(onclose).toHaveBeenCalled())
    expect(updateItem).toHaveBeenCalledWith(4, 8, { title: 'Kotlin', url: 'https://java.com' })
    expect(addItem).not.toHaveBeenCalled()
  })
})
