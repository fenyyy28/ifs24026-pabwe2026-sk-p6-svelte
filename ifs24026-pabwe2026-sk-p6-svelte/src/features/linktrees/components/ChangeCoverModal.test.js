import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'

vi.mock('../api/linkTreeApi.js', () => ({ changeCover: vi.fn(), getLinkTree: vi.fn() }))

import { changeCover, getLinkTree } from '../api/linkTreeApi.js'
import ChangeCoverModal from './ChangeCoverModal.svelte'

const user = userEvent.setup({ applyAccept: false })
const png = (name = 'a.png') => new File(['x'], name, { type: 'image/png' })
let onclose
const open = (cover = '') => render(ChangeCoverModal, { linkTree: { id: 4, cover }, onclose })
const input = () => document.querySelector('input[type="file"]')
const submit = () => user.click(screen.getByRole('button', { name: 'Unggah' }))

beforeEach(() => {
  changeCover.mockReset()
  getLinkTree.mockReset()
  onclose = vi.fn()
  URL.createObjectURL = vi.fn(() => 'blob:preview')
  URL.revokeObjectURL = vi.fn()
})

describe('ChangeCoverModal', () => {
  it('tanpa sampul menampilkan pesan', () => {
    open('http://localhost:8000/')
    expect(screen.getByText('Belum ada sampul.')).toBeInTheDocument()
  })

  it('menampilkan sampul saat ini', () => {
    open('img/cover.png')
    expect(screen.getByAltText('Sampul')).toHaveAttribute('src', 'https://open-api.delcom.org/img/cover.png')
  })

  it('menolak unggah tanpa memilih berkas', async () => {
    open()
    await submit()
    expect(screen.getByText('Pilih gambar terlebih dahulu')).toBeInTheDocument()
    expect(changeCover).not.toHaveBeenCalled()
  })

  it('menolak berkas non-gambar', async () => {
    open()
    await user.upload(input(), new File(['x'], 'a.txt', { type: 'text/plain' }))
    expect(await screen.findByText('File harus berupa gambar')).toBeInTheDocument()
  })

  it('non-gambar setelah gambar valid membuang pratinjau lama', async () => {
    open()
    await user.upload(input(), png())
    await screen.findByAltText('Sampul')
    await user.upload(input(), new File(['x'], 'a.txt', { type: 'text/plain' }))
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview')
    expect(await screen.findByText('File harus berupa gambar')).toBeInTheDocument()
  })

  it('menampilkan pratinjau dan mengosongkannya saat pilihan dibatalkan', async () => {
    open()
    await user.upload(input(), png())
    expect(await screen.findByAltText('Sampul')).toHaveAttribute('src', 'blob:preview')
    await fireEvent.change(input(), { target: { files: [] } })
    expect(URL.revokeObjectURL).toHaveBeenCalled()
    expect(await screen.findByText('Belum ada sampul.')).toBeInTheDocument()
  })

  it('pilihan kosong tanpa pratinjau sebelumnya', async () => {
    open()
    await fireEvent.change(input(), { target: { files: [] } })
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
  })

  it('berhasil mengunggah lalu menutup', async () => {
    changeCover.mockResolvedValue()
    getLinkTree.mockResolvedValue({ id: 4 })
    open()
    const file = png()
    await user.upload(input(), file)
    await submit()
    await waitFor(() => expect(onclose).toHaveBeenCalled())
    expect(changeCover).toHaveBeenCalledWith(4, file)
  })

  it('menampilkan galat dan status mengunggah', async () => {
    let fail
    changeCover.mockReturnValue(new Promise((_, r) => (fail = r)))
    open()
    await user.upload(input(), png())
    await submit()
    expect(await screen.findByRole('button', { name: 'Mengunggah...' })).toBeDisabled()
    fail(new Error('Terlalu besar'))
    expect(await screen.findByText('Terlalu besar')).toBeInTheDocument()
  })

  it('Batal menutup', async () => {
    open()
    await user.click(screen.getByRole('button', { name: 'Batal' }))
    expect(onclose).toHaveBeenCalled()
  })
})
