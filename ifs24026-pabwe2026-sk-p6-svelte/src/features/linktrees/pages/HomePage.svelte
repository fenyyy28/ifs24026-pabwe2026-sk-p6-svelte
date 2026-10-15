<script>
  import LinkLogo from '../../../lib/components/LinkLogo.svelte'
  import { navigate } from '../../../lib/router/router.js'
  import { resolveAssetUrl, resolveCoverUrl } from '../../../lib/helpers/toolsHelper.js'
  import { profile } from '../../users/userStore.js'
  import {
    linkTrees, listLoading, listError, mutations,
    fetchLinkTrees, removeLinkTree, removeAllLinkTrees,
  } from '../states/linkTreesStore.js'
  import { typeLabel } from '../constants.js'
  import AddModal from '../components/AddModal.svelte'

  let search = $state('')
  let mine = $state(false)
  let showAdd = $state(false)
  let actionError = $state('')

  // Muat ulang saat filter "milik saya" berubah
  $effect(() => {
    fetchLinkTrees({ mine })
  })

  let filtered = $derived.by(() => {
    const q = search.trim().toLowerCase()
    if (!q) return $linkTrees
    return $linkTrees.filter((lt) =>
      [lt.title, lt.description, lt.author?.name].some((v) => (v ?? '').toLowerCase().includes(q))
    )
  })

  let stats = $derived({
    total: $linkTrees.length,
    public: $linkTrees.filter((l) => l.type === 'public').length,
    unlisted: $linkTrees.filter((l) => l.type === 'unlisted').length,
    private: $linkTrees.filter((l) => l.type === 'private').length,
    links: $linkTrees.reduce((sum, l) => sum + (l.total_links ?? 0), 0),
  })

  const isOwner = (lt) => $profile && Number(lt.user_id) === Number($profile.id)

  function open(event, id) {
    event.preventDefault()
    navigate(`/link-trees/${id}`)
  }

  async function handleDelete(lt) {
    if (!confirm(`Hapus link tree "${lt.title}" beserta seluruh tautannya?`)) return
    actionError = ''
    try {
      await removeLinkTree(lt.id)
    } catch (err) {
      actionError = err.message
    }
  }

  async function handleDeleteAll() {
    if (!confirm('Hapus SEMUA link tree milik kamu beserta cover dan tautannya? Tindakan ini permanen.')) return
    actionError = ''
    try {
      await removeAllLinkTrees()
      await fetchLinkTrees({ mine })
    } catch (err) {
      actionError = err.message
    }
  }
</script>

<main class="page wide">
  <div class="head">
    <div>
      <h1>Semua Link Tree</h1>
      <p class="muted">Kumpulan tautan dari seluruh pengguna.</p>
    </div>
    <button class="btn" onclick={() => (showAdd = true)}>+ Tambah Link Tree</button>
  </div>

  <section class="stats">
    <div class="card stat"><span>Total</span><strong>{stats.total}</strong></div>
    <div class="card stat"><span>Publik</span><strong>{stats.public}</strong></div>
    <div class="card stat"><span>Tidak Terdaftar</span><strong>{stats.unlisted}</strong></div>
    <div class="card stat"><span>Privat</span><strong>{stats.private}</strong></div>
    <div class="card stat"><span>Total Tautan</span><strong>{stats.links}</strong></div>
  </section>

  <div class="toolbar">
    <input type="search" placeholder="Cari judul, deskripsi, atau penulis..." bind:value={search} />
    <label class="check">
      <input type="checkbox" bind:checked={mine} />
      Milik saya
    </label>
    {#if mine && $linkTrees.length > 0}
      <button class="btn danger sm" onclick={handleDeleteAll} disabled={$mutations.removeAll}>
        {$mutations.removeAll ? 'Menghapus...' : 'Hapus Semua Milik Saya'}
      </button>
    {/if}
  </div>

  {#if actionError}<p class="alert error">{actionError}</p>{/if}

  {#if $listLoading}
    <p>Memuat data...</p>
  {:else if $listError}
    <p class="alert error">{$listError}</p>
  {:else if filtered.length === 0}
    <p class="muted">
      {search ? 'Tidak ada hasil yang cocok.' : mine ? 'Kamu belum punya link tree.' : 'Belum ada link tree.'}
    </p>
  {:else}
    <div class="grid">
      {#each filtered as lt (lt.id)}
        {@const cover = resolveCoverUrl(lt.cover)}
        <article class="card lt">
          <a class="cover" href={`/link-trees/${lt.id}`} onclick={(e) => open(e, lt.id)}>
            {#if cover}
              <img src={cover} alt={lt.title} />
            {:else}
              <div class="cover-empty"><LinkLogo size={40} color="#94a3b8" /></div>
            {/if}
          </a>
          <div class="info">
            <span class={'badge ' + lt.type}>{typeLabel(lt.type)}</span>
            <h2>
              <a href={`/link-trees/${lt.id}`} onclick={(e) => open(e, lt.id)}>{lt.title}</a>
            </h2>
            <p class="muted clamp">{lt.description || 'Tanpa deskripsi'}</p>
            <div class="meta">
              <img class="avatar" src={resolveAssetUrl(lt.author?.photo)} alt="" />
              <span>{lt.author?.name}</span>
              <span class="dot">·</span>
              <span>{(lt.total_links ?? 0) + ' tautan'}</span>
            </div>
          </div>
          {#if isOwner(lt)}
            <button class="del" onclick={() => handleDelete(lt)} disabled={$mutations.remove}>Hapus</button>
          {/if}
        </article>
      {/each}
    </div>
  {/if}
</main>

{#if showAdd}
  <AddModal onclose={() => (showAdd = false)} />
{/if}

<style>
  .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap; }
  .head h1 { margin-bottom: 0.25rem; }
  .head .btn { padding: 0.6rem 1rem; }
  .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.75rem; margin: 1rem 0; }
  .stat { margin: 0; padding: 0.9rem; display: flex; flex-direction: column; gap: 0.2rem; }
  .stat span { font-size: 0.8rem; color: #64748b; }
  .stat strong { font-size: 1.5rem; }
  .toolbar { display: flex; gap: 1rem; align-items: center; flex-wrap: wrap; margin-bottom: 1rem; }
  .toolbar input[type='search'] { flex: 1; min-width: 220px; padding: 0.6rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font: inherit; }
  .check { display: flex; align-items: center; gap: 0.4rem; font-size: 0.9rem; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; }
  .lt { padding: 0; margin: 0; overflow: hidden; position: relative; display: flex; flex-direction: column; }
  .cover img, .cover-empty { width: 100%; height: 130px; object-fit: cover; display: block; background: #e2e8f0; }
  .cover-empty { display: flex; align-items: center; justify-content: center; }
  .info { padding: 0.9rem; display: flex; flex-direction: column; gap: 0.4rem; }
  h2 { margin: 0; font-size: 1.05rem; }
  h2 a { color: inherit; text-decoration: none; }
  h2 a:hover { color: #4f46e5; }
  .clamp { margin: 0; display: -webkit-box; -webkit-line-clamp: 2; line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
  .meta { display: flex; align-items: center; gap: 0.4rem; font-size: 0.85rem; color: #64748b; }
  .avatar { width: 22px; height: 22px; border-radius: 50%; object-fit: cover; background: #e2e8f0; }
  .del { position: absolute; top: 0.5rem; right: 0.5rem; border: 0; border-radius: 6px; padding: 0.25rem 0.6rem; background: rgba(255,255,255,0.92); color: #b91c1c; cursor: pointer; font: inherit; font-size: 0.8rem; }
</style>