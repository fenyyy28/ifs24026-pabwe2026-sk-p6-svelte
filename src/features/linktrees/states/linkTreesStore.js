import { writable } from 'svelte/store'
import * as api from '../api/linkTreeApi.js'

// Koleksi dan detail
export const linkTrees = writable([])
export const linkTree = writable(null)

// Status pemuatan dan galat
export const listLoading = writable(false)
export const detailLoading = writable(false)
export const listError = writable('')
export const detailError = writable('')

// Bendera mutasi
export const mutations = writable({
  add: false,
  change: false,
  cover: false,
  remove: false,
  removeAll: false,
  item: false,
})

async function mutate(key, fn) {
  mutations.update((m) => ({ ...m, [key]: true }))
  try {
    return await fn()
  } finally {
    mutations.update((m) => ({ ...m, [key]: false }))
  }
}

export async function fetchLinkTrees({ mine = false } = {}) {
  listLoading.set(true)
  listError.set('')
  try {
    linkTrees.set(await api.getLinkTrees({ isMe: mine }))
  } catch (err) {
    linkTrees.set([])
    listError.set(err.message)
  } finally {
    listLoading.set(false)
  }
}

export async function fetchLinkTree(id, { silent = false } = {}) {
  if (!silent) {
    linkTree.set(null)
    detailLoading.set(true)
  }
  detailError.set('')
  try {
    linkTree.set(await api.getLinkTree(id))
  } catch (err) {
    detailError.set(err.message)
  } finally {
    detailLoading.set(false)
  }
}

export function addLinkTree(payload) {
  return mutate('add', () => api.createLinkTree(payload))
}

export function changeLinkTree(id, payload) {
  return mutate('change', async () => {
    await api.updateLinkTree(id, payload)
    await fetchLinkTree(id, { silent: true })
  })
}

export function changeLinkTreeCover(id, file) {
  return mutate('cover', async () => {
    await api.changeCover(id, file)
    await fetchLinkTree(id, { silent: true })
  })
}

export function removeLinkTree(id) {
  return mutate('remove', async () => {
    await api.deleteLinkTree(id)
    linkTrees.update((list) => list.filter((lt) => lt.id !== id))
  })
}

export function removeAllLinkTrees() {
  return mutate('removeAll', () => api.deleteAllLinkTrees())
}

export function addLinkItem(treeId, payload) {
  return mutate('item', async () => {
    await api.addItem(treeId, payload)
    await fetchLinkTree(treeId, { silent: true })
  })
}

export function changeLinkItem(treeId, itemId, payload) {
  return mutate('item', async () => {
    await api.updateItem(treeId, itemId, payload)
    await fetchLinkTree(treeId, { silent: true })
  })
}

export function removeLinkItem(treeId, itemId) {
  return mutate('item', async () => {
    await api.deleteItem(treeId, itemId)
    await fetchLinkTree(treeId, { silent: true })
  })
}