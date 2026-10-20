<script>
  import { untrack } from 'svelte'
  import LinkLogo from '../../../lib/components/LinkLogo.svelte'
  import { navigate } from '../../../lib/router/router.js'
  import { formatDate, resolveAssetUrl, resolveCoverUrl } from '../../../lib/helpers/toolsHelper.js'
  import { profile } from '../../users/userStore.js'
  import {
    linkTree, detailLoading, detailError, mutations,
    fetchLinkTree, removeLinkTree, removeLinkItem,
  } from '../states/linkTreesStore.js'
  import { typeLabel } from '../constants.js'
  import ChangeModal from '../components/ChangeModal.svelte'
  import ChangeCoverModal from '../components/ChangeCoverModal.svelte'
  import ItemModal from '../components/ItemModal.svelte'

  let { linkTreeId } = $props()

  let modal = $state(null) // 'change' | 'cover' | 'item' | null
  let editingItem = $state(null)
  let actionError = $state('')

  $effect(() => {
    const id = linkTreeId
    untrack(() => fetchLinkTree(id))
  })

  // Hindari menampilkan data detail milik id sebelumnya
  let current = $derived(
    $linkTree && String($linkTree.id) === String(linkTreeId) ? $linkTree : null
  )
  let isOwner = $derived(
    !!current && !!$profile && Number(current.user_id) === Number($profile.id)
  )

  function openItemModal(item = null) {
    editingItem = item
    modal = 'item'
  }

  function closeModal() {
    modal = null
    editingItem = null
  }

  async function handleDelete() {
    if (!confirm(`Hapus link tree "${current.title}" beserta seluruh tautannya?`)) return
    actionError = ''
    try {
      await removeLinkTree(current.id)
      navigate('/')
    } catch (err) {
      actionError = err.message
    }
  }

  async function handleDeleteItem(item) {
    if (!confirm(`Hapus tautan "${item.title}"?`)) return
    actionError = ''
    try {
      await removeLinkItem(current.id, item.id)
    } catch (err) {
      actionError = err.message
    }
  }
</script>

<main class="page">
  <a class="back" href="/" onclick={(e) => { e.preventDefault(); navigate('/') }}>← Semua Link Tree</a>

  {#if $detailLoading}
    <h1>Detail Link Tree</h1>
    <p>Memuat data...</p>
  {:else if $detailError}
    <h1>Detail Link Tree</h1>
    <p class="alert error">{$detailError}</p>
  {:else if current}
    {@const cover = resolveCoverUrl(current.cover)}
    <section class="card hero">
      {#if cover}
        <img class="cover" src={cover} alt={current.title} />
      {:else}
        <div class="cover empty"><LinkLogo size={48} color="#94a3b8" /></div>
      {/if}

      <div class="hero-body">
        <span class={'badge ' + current.type}>{typeLabel(current.type)}</span>
        <h1>{current.title}</h1>
        <p class="muted">{current.description || 'Tanpa deskripsi'}</p>
        <div class="meta">
          <img class="avatar" src={resolveAssetUrl(current.author?.photo)} alt="" />
          <span>{current.author?.name}</span>
          <span class="dot">·</span>
          <span>Dibuat {formatDate(current.created_at)}</span>
        </div>

        {#if isOwner}
          <div class="owner-actions">
            <button class="btn secondary sm" onclick={() => (modal = 'change')}>Ubah Data</button>
            <button class="btn secondary sm" onclick={() => (modal = 'cover')}>Ubah Sampul</button>
            <button class="btn danger sm" onclick={handleDelete} disabled={$mutations.remove}>
              {$mutations.remove ? 'Menghapus...' : 'Hapus'}
            </button>
          </div>
        {/if}
      </div>
    </section>

    {#if actionError}<p class="alert error">{actionError}</p>{/if}

    <section class="card">
      <div class="items-head">
        <h2>{'Tautan (' + (current.items?.length ?? 0) + ')'}</h2>
        {#if isOwner}
          <button class="btn sm" onclick={() => openItemModal()}>+ Tambah Tautan</button>
        {/if}
      </div>

      {#if !current.items || current.items.length === 0}
        <p class="muted">Belum ada tautan.</p>
      {:else}
        <ul class="items">
          {#each current.items as item (item.id)}
            <li>
              <a class="link" href={item.url} target="_blank" rel="noopener noreferrer">
                <strong>{item.title}</strong>
                <span class="muted url">{item.url}</span>
              </a>
              {#if isOwner}
                <div class="row-actions">
                  <button class="btn secondary sm" onclick={() => openItemModal(item)}>Ubah</button>
                  <button class="btn danger sm" onclick={() => handleDeleteItem(item)} disabled={$mutations.item}>Hapus</button>
                </div>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </section>

    {#if modal === 'change'}
      <ChangeModal linkTree={current} onclose={closeModal} />
    {:else if modal === 'cover'}
      <ChangeCoverModal linkTree={current} onclose={closeModal} />
    {:else if modal === 'item'}
      <ItemModal linkTreeId={current.id} item={editingItem} onclose={closeModal} />
    {/if}
  {/if}
</main>

<style>
  .back { display: inline-block; margin-bottom: 1rem; color: #4f46e5; text-decoration: none; font-size: 0.9rem; }
  .hero { padding: 0; overflow: hidden; }
  .cover { width: 100%; height: 200px; object-fit: cover; display: block; background: #e2e8f0; }
  .cover.empty { display: flex; align-items: center; justify-content: center; }
  .hero-body { padding: 1.25rem; display: flex; flex-direction: column; gap: 0.5rem; }
  .hero-body h1 { margin: 0; }
  .hero-body p { margin: 0; }
  .meta { display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; color: #64748b; }
  .avatar { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; background: #e2e8f0; }
  .owner-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; margin-top: 0.5rem; }
  .items-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
  .items-head h2 { margin: 0; font-size: 1.1rem; }
  .items { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.6rem; }
  .items li { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 10px; }
  .link { display: flex; flex-direction: column; min-width: 0; color: inherit; text-decoration: none; }
  .link:hover strong { color: #4f46e5; }
  .url { font-size: 0.8rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .row-actions { display: flex; gap: 0.4rem; flex-shrink: 0; }
</style>