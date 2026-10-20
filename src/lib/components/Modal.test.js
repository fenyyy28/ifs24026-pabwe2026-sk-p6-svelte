import { describe, it, expect, vi } from 'vitest'
import { createRawSnippet } from 'svelte'
import { render, screen } from '@testing-library/svelte'
import userEvent from '@testing-library/user-event'
import Modal from './Modal.svelte'

const children = createRawSnippet(() => ({ render: () => '<p>isi modal</p>' }))

function setup() {
  const onclose = vi.fn()
  const view = render(Modal, { title: 'Judul Modal', onclose, children })
  return { onclose, ...view }
}

describe('Modal', () => {
  it('menampilkan judul dan isi', () => {
    setup()
    expect(screen.getByRole('dialog', { name: 'Judul Modal' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Judul Modal' })).toBeInTheDocument()
    expect(screen.getByText('isi modal')).toBeInTheDocument()
  })

  it('tombol tutup memanggil onclose', async () => {
    const { onclose } = setup()
    await userEvent.click(screen.getByRole('button', { name: 'Tutup' }))
    expect(onclose).toHaveBeenCalledTimes(1)
  })

  it('klik latar menutup, klik di dalam dialog tidak', async () => {
    const { onclose, container } = setup()
    await userEvent.click(screen.getByText('isi modal'))
    expect(onclose).not.toHaveBeenCalled()
    await userEvent.click(container.querySelector('.backdrop'))
    expect(onclose).toHaveBeenCalledTimes(1)
  })

  it('tombol Escape menutup, tombol lain tidak', async () => {
    const { onclose } = setup()
    await userEvent.keyboard('a')
    expect(onclose).not.toHaveBeenCalled()
    await userEvent.keyboard('{Escape}')
    expect(onclose).toHaveBeenCalledTimes(1)
  })
})
