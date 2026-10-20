import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import { get } from 'svelte/store'

vi.mock('../api/linkTreeApi.js', () => ({ createLinkTree: vi.fn() }))

import { createLinkTree } from '../api/linkTreeApi.js'
import { navigate, path } from '../../../router.js'
import AddModal from './AddModal.svelte'

let onclose
beforeEach(() => {
  createLinkTree.mockReset()
  onclose = vi.fn()
  navigate('/', { replace: true })
  render(AddModal, { onclose })
})
const submit = () => userEvent.click(screen.getByRole('button', { name: 'Simpan' }))

describe('AddModal', () => {
  it('menampilkan form dengan tiga tipe', () => {
    expect(screen.getByRole('dialog', { name: 'Tambah Link Tree' })).toBeInTheDocument()
    expect(screen.getAllByRole('option').map((o) => o.value)).toEqual(['public', 'unlisted', 'private'])
  })

  it('menolak judul kosong', async () => {
    await submit()
    expect(screen.getByText('Judul wajib diisi')).toBeInTheDocument()
    expect(createLinkTree).not.toHaveBeenCalled()
  })

  it('menyimpan, menutup modal, dan menuju detail', async () => {
    createLinkTree.mockResolvedValue(12)
    await userEvent.type(screen.getByLabelText('Judul'), '  Kursus  ')
    await userEvent.selectOptions(screen.getByLabelText('Tipe'), 'private')
    await userEvent.type(screen.getByLabelText('Deskripsi'), ' Deskripsi ')
    await submit()
    await waitFor(() => expect(onclose).toHaveBeenCalled())
    expect(createLinkTree).toHaveBeenCalledWith({ title: 'Kursus', type: 'private', description: 'Deskripsi' })
    expect(get(path)).toBe('/link-trees/12')
  })

  it('menampilkan galat dan tetap terbuka', async () => {
    createLinkTree.mockRejectedValue(new Error('Gagal menyimpan'))
    await userEvent.type(screen.getByLabelText('Judul'), 'Kursus')
    await submit()
    expect(await screen.findByText('Gagal menyimpan')).toBeInTheDocument()
    expect(onclose).not.toHaveBeenCalled()
  })

  it('menampilkan status menyimpan', async () => {
    let finish
    createLinkTree.mockReturnValue(new Promise((r) => (finish = r)))
    await userEvent.type(screen.getByLabelText('Judul'), 'Kursus')
    await submit()
    expect(await screen.findByRole('button', { name: 'Menyimpan...' })).toBeDisabled()
    finish(1)
  })

  it('tombol Batal menutup', async () => {
    await userEvent.click(screen.getByRole('button', { name: 'Batal' }))
    expect(onclose).toHaveBeenCalled()
  })
})
