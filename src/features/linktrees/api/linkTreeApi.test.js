import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../../../lib/helpers/apiHelper.js', () => ({ apiRequest: vi.fn() }))

import { apiRequest } from '../../../lib/helpers/apiHelper.js'
import * as api from './linkTreeApi.js'

beforeEach(() => apiRequest.mockReset())

describe('linkTreeApi', () => {
  it('createLinkTree', async () => {
    apiRequest.mockResolvedValue({ data: { link_tree_id: 7 } })
    const id = await api.createLinkTree({ title: 't', type: 'public', description: 'd' })
    expect(id).toBe(7)
    expect(apiRequest).toHaveBeenCalledWith('/link-trees', {
      method: 'POST',
      body: { title: 't', type: 'public', description: 'd' },
    })
  })

  it('changeCover mengirim FormData', async () => {
    apiRequest.mockResolvedValue({})
    const file = new File(['x'], 'c.png', { type: 'image/png' })
    await api.changeCover(3, file)
    const [url, opts] = apiRequest.mock.calls[0]
    expect(url).toBe('/link-trees/3/cover')
    expect(opts.method).toBe('POST')
    expect(opts.body).toBeInstanceOf(FormData)
    expect(opts.body.get('cover')).toBe(file)
  })

  it('updateLinkTree', async () => {
    apiRequest.mockResolvedValue({})
    await api.updateLinkTree(3, { title: 't', type: 'private', description: 'd' })
    expect(apiRequest).toHaveBeenCalledWith('/link-trees/3', {
      method: 'PUT',
      body: { title: 't', type: 'private', description: 'd' },
    })
  })

  it('getLinkTrees tanpa argumen dan dengan isMe', async () => {
    apiRequest.mockResolvedValue({ data: { link_trees: [1] } })
    expect(await api.getLinkTrees()).toEqual([1])
    expect(apiRequest).toHaveBeenLastCalledWith('/link-trees')
    await api.getLinkTrees({ isMe: false })
    expect(apiRequest).toHaveBeenLastCalledWith('/link-trees')
    await api.getLinkTrees({ isMe: true })
    expect(apiRequest).toHaveBeenLastCalledWith('/link-trees?is_me=1')
  })

  it('getLinkTree', async () => {
    apiRequest.mockResolvedValue({ data: { link_tree: { id: 5 } } })
    expect(await api.getLinkTree(5)).toEqual({ id: 5 })
    expect(apiRequest).toHaveBeenCalledWith('/link-trees/5')
  })

  it('deleteLinkTree dan deleteAllLinkTrees', async () => {
    apiRequest.mockResolvedValue({})
    await api.deleteLinkTree(5)
    expect(apiRequest).toHaveBeenLastCalledWith('/link-trees/5', { method: 'DELETE' })
    await api.deleteAllLinkTrees()
    expect(apiRequest).toHaveBeenLastCalledWith('/link-trees', { method: 'DELETE' })
  })

  it('addItem, updateItem, deleteItem', async () => {
    apiRequest.mockResolvedValue({ data: { item_id: 9 } })
    expect(await api.addItem(1, { title: 'a', url: 'https://a.id' })).toBe(9)
    expect(apiRequest).toHaveBeenLastCalledWith('/link-trees/1/items', {
      method: 'POST',
      body: { title: 'a', url: 'https://a.id' },
    })
    await api.updateItem(1, 9, { title: 'b', url: 'https://b.id' })
    expect(apiRequest).toHaveBeenLastCalledWith('/link-trees/1/items/9', {
      method: 'PUT',
      body: { title: 'b', url: 'https://b.id' },
    })
    await api.deleteItem(1, 9)
    expect(apiRequest).toHaveBeenLastCalledWith('/link-trees/1/items/9', { method: 'DELETE' })
  })
})
