import { apiRequest } from '../../../lib/helpers/apiHelper.js'

export async function createLinkTree({ title, type, description }) {
  const res = await apiRequest('/link-trees', {
    method: 'POST',
    body: { title, type, description },
  })
  return res.data.link_tree_id
}

export async function changeCover(id, file) {
  const form = new FormData()
  form.append('cover', file)
  await apiRequest(`/link-trees/${id}/cover`, { method: 'POST', body: form })
}

export async function updateLinkTree(id, { title, type, description }) {
  await apiRequest(`/link-trees/${id}`, {
    method: 'PUT',
    body: { title, type, description },
  })
}

export async function getLinkTrees({ isMe = false } = {}) {
  const res = await apiRequest(isMe ? '/link-trees?is_me=1' : '/link-trees')
  return res.data.link_trees
}

export async function getLinkTree(id) {
  const res = await apiRequest(`/link-trees/${id}`)
  return res.data.link_tree
}

export async function deleteLinkTree(id) {
  await apiRequest(`/link-trees/${id}`, { method: 'DELETE' })
}

export async function deleteAllLinkTrees() {
  await apiRequest('/link-trees', { method: 'DELETE' })
}

export async function addItem(id, { title, url }) {
  const res = await apiRequest(`/link-trees/${id}/items`, {
    method: 'POST',
    body: { title, url },
  })
  return res.data.item_id
}

export async function updateItem(id, itemId, { title, url }) {
  await apiRequest(`/link-trees/${id}/items/${itemId}`, {
    method: 'PUT',
    body: { title, url },
  })
}

export async function deleteItem(id, itemId) {
  await apiRequest(`/link-trees/${id}/items/${itemId}`, { method: 'DELETE' })
}