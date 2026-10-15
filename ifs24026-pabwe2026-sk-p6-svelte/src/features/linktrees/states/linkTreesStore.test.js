import { describe, it, expect, vi, beforeEach } from 'vitest'
import { get } from 'svelte/store'

vi.mock('../api/linkTreeApi.js', () => ({
  getLinkTrees: vi.fn(),
  getLinkTree: vi.fn(),
  createLinkTree: vi.fn(),
  updateLinkTree: vi.fn(),
  changeCover: vi.fn(),
  deleteLinkTree: vi.fn(),
  deleteAllLinkTrees: vi.fn(),
  addItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
}))

import * as api from '../api/linkTreeApi.js'
import * as s from './linkTreesStore.js'

beforeEach(() => {
  s.linkTrees.set([])
  s.linkTree.set(null)
  s.listError.set('')
  s.detailError.set('')
})

describe('fetchLinkTrees', () => {
  it('mengisi koleksi (default dan mine)', async () => {
    api.getLinkTrees.mockResolvedValue([{ id: 1 }])
    await s.fetchLinkTrees()
    expect(api.getLinkTrees).toHaveBeenLastCalledWith({ isMe: false })
    expect(get(s.linkTrees)).toEqual([{ id: 1 }])
    expect(get(s.listLoading)).toBe(false)
    await s.fetchLinkTrees({ mine: true })
    expect(api.getLinkTrees).toHaveBeenLastCalledWith({ isMe: true })
  })
  it('menyimpan galat dan mengosongkan koleksi', async () => {
    s.linkTrees.set([{ id: 1 }])
    api.getLinkTrees.mockRejectedValue(new Error('gagal'))
    await s.fetchLinkTrees()
    expect(get(s.listError)).toBe('gagal')
    expect(get(s.linkTrees)).toEqual([])
    expect(get(s.listLoading)).toBe(false)
  })
})

describe('fetchLinkTree', () => {
  it('memuat detail (default)', async () => {
    api.getLinkTree.mockResolvedValue({ id: 2 })
    const p = s.fetchLinkTree(2)
    expect(get(s.detailLoading)).toBe(true)
    expect(get(s.linkTree)).toBeNull()
    await p
    expect(get(s.linkTree)).toEqual({ id: 2 })
    expect(get(s.detailLoading)).toBe(false)
  })
  it('mode silent tidak mengosongkan detail', async () => {
    s.linkTree.set({ id: 2, old: true })
    api.getLinkTree.mockResolvedValue({ id: 2 })
    const p = s.fetchLinkTree(2, { silent: true })
    expect(get(s.linkTree)).toEqual({ id: 2, old: true })
    await p
    expect(get(s.linkTree)).toEqual({ id: 2 })
  })
  it('menyimpan galat', async () => {
    api.getLinkTree.mockRejectedValue(new Error('404'))
    await s.fetchLinkTree(9)
    expect(get(s.detailError)).toBe('404')
  })
})

describe('mutasi', () => {
  beforeEach(() => api.getLinkTree.mockResolvedValue({ id: 1, fresh: true }))

  it('addLinkTree menyalakan lalu mematikan bendera add', async () => {
    api.createLinkTree.mockImplementation(async () => {
      expect(get(s.mutations).add).toBe(true)
      return 5
    })
    expect(await s.addLinkTree({ title: 't' })).toBe(5)
    expect(get(s.mutations).add).toBe(false)
  })

  it('bendera dimatikan walau gagal', async () => {
    api.createLinkTree.mockRejectedValue(new Error('x'))
    await expect(s.addLinkTree({})).rejects.toThrow('x')
    expect(get(s.mutations).add).toBe(false)
  })

  it('changeLinkTree memuat ulang detail', async () => {
    api.updateLinkTree.mockResolvedValue()
    await s.changeLinkTree(1, { title: 'n' })
    expect(api.updateLinkTree).toHaveBeenCalledWith(1, { title: 'n' })
    expect(get(s.linkTree)).toEqual({ id: 1, fresh: true })
    expect(get(s.mutations).change).toBe(false)
  })

  it('changeLinkTreeCover memuat ulang detail', async () => {
    api.changeCover.mockResolvedValue()
    const file = new File(['x'], 'c.png')
    await s.changeLinkTreeCover(1, file)
    expect(api.changeCover).toHaveBeenCalledWith(1, file)
    expect(get(s.linkTree).fresh).toBe(true)
    expect(get(s.mutations).cover).toBe(false)
  })

  it('removeLinkTree membuang dari koleksi', async () => {
    s.linkTrees.set([{ id: 1 }, { id: 2 }])
    api.deleteLinkTree.mockResolvedValue()
    await s.removeLinkTree(1)
    expect(get(s.linkTrees)).toEqual([{ id: 2 }])
    expect(get(s.mutations).remove).toBe(false)
  })

  it('removeAllLinkTrees', async () => {
    api.deleteAllLinkTrees.mockResolvedValue()
    await s.removeAllLinkTrees()
    expect(api.deleteAllLinkTrees).toHaveBeenCalled()
    expect(get(s.mutations).removeAll).toBe(false)
  })

  it('mutasi item menambah, mengubah, menghapus lalu memuat ulang', async () => {
    api.addItem.mockResolvedValue(1)
    api.updateItem.mockResolvedValue()
    api.deleteItem.mockResolvedValue()
    await s.addLinkItem(1, { title: 'a', url: 'u' })
    expect(api.addItem).toHaveBeenCalledWith(1, { title: 'a', url: 'u' })
    await s.changeLinkItem(1, 4, { title: 'b', url: 'u' })
    expect(api.updateItem).toHaveBeenCalledWith(1, 4, { title: 'b', url: 'u' })
    await s.removeLinkItem(1, 4)
    expect(api.deleteItem).toHaveBeenCalledWith(1, 4)
    expect(api.getLinkTree).toHaveBeenCalledTimes(3)
    expect(get(s.mutations).item).toBe(false)
  })
})
