import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'

vi.mock('../api/linkTreeApi.js', () => ({ updateLinkTree: vi.fn(), getLinkTree: vi.fn() }))

import { updateLinkTree, getLinkTree } from '../api/linkTreeApi.js'
import ChangeModal from './ChangeModal.svelte'

const tree = { id: 4, title: 'Lama', type: 'unlisted', description: 'Desk' }
let onclose
const open = (linkTree = tree) => render(ChangeModal, { linkTree, onclose })
const submit = () => userEvent.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))

beforeEach(() => {
  updateLinkTree.mockReset()
  getLinkTree.mockReset()
  onclose = vi.fn()
})

describe('ChangeModal', () => {
  it('terisi data yang ada', () => {
    open()
    expect(screen.getByLabelText('Judul')).toHaveValue('Lama')
    expect(screen.getByLabelText('Tipe')).toHaveValue('unlisted')
    expect(screen.getByLabelText('Deskripsi')).toHaveValue('Desk')
  })

  it('deskripsi null menjadi kosong', () => {
    open({ ...tree, description: null })
    expect(screen.getByLabelText('Deskripsi')).toHaveValue('')
  })

  it('menolak judul kosong', async () => {
    open()
    await userEvent.clear(screen.getByLabelText('Judul'))
    await submit()
    expect(screen.getByText('Judul wajib diisi')).toBeInTheDocument()
    expect(updateLinkTree).not.toHaveBeenCalled()
  })

  it('menyimpan perubahan lalu menutup', async () => {
    updateLinkTree.mockResolvedValue()
    getLinkTree.mockResolvedValue({ id: 4 })
    open()
    const title = screen.getByLabelText('Judul')
    await userEvent.clear(title)
    await userEvent.type(title, ' Baru ')
    await userEvent.selectOptions(screen.getByLabelText('Tipe'), 'public')
    const description = screen.getByLabelText('Deskripsi')
    await userEvent.clear(description)
    await userEvent.type(description, ' Deskripsi baru ')
    await submit()
    await waitFor(() => expect(onclose).toHaveBeenCalled())
    expect(updateLinkTree).toHaveBeenCalledWith(4, { title: 'Baru', type: 'public', description: 'Deskripsi baru' })
  })

  it('menampilkan galat dan status menyimpan', async () => {
    let fail
    updateLinkTree.mockReturnValue(new Promise((_, r) => (fail = r)))
    open()
    await submit()
    expect(await screen.findByRole('button', { name: 'Menyimpan...' })).toBeDisabled()
    fail(new Error('Ditolak'))
    expect(await screen.findByText('Ditolak')).toBeInTheDocument()
    expect(onclose).not.toHaveBeenCalled()
  })

  it('Batal menutup', async () => {
    open()
    await userEvent.click(screen.getByRole('button', { name: 'Batal' }))
    expect(onclose).toHaveBeenCalled()
  })
})
