<script>
  import Modal from '../../../lib/components/Modal.svelte'
  import { resolveCoverUrl } from '../../../lib/helpers/toolsHelper.js'
  import { changeLinkTreeCover, mutations } from '../states/linkTreesStore.js'

  let { linkTree, onclose } = $props()

  let file = $state(null)
  let preview = $state('')
  let error = $state('')

  function handleFile(event) {
    const picked = event.target.files?.[0]
    error = ''
    if (preview) URL.revokeObjectURL(preview)
    if (!picked) {
      file = null
      preview = ''
      return
    }
    if (!picked.type.startsWith('image/')) {
      error = 'File harus berupa gambar'
      file = null
      preview = ''
      event.target.value = ''
      return
    }
    file = picked
    preview = URL.createObjectURL(picked)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    error = ''
    if (!file) {
      error = 'Pilih gambar terlebih dahulu'
      return
    }
    try {
      await changeLinkTreeCover(linkTree.id, file)
      onclose()
    } catch (err) {
      error = err.message
    }
  }

  let current = $derived(preview || resolveCoverUrl(linkTree.cover))
</script>

<Modal title="Ubah Sampul" {onclose}>
  <form class="form" onsubmit={handleSubmit}>
    {#if error}<p class="alert error">{error}</p>{/if}
    {#if current}
      <img class="preview" src={current} alt="Sampul" />
    {:else}
      <p class="muted">Belum ada sampul.</p>
    {/if}
    <input type="file" accept="image/*" aria-label="Pilih berkas sampul" onchange={handleFile} />
    <div class="actions">
      <button type="button" class="btn secondary" onclick={onclose}>Batal</button>
      <button type="submit" class="btn" disabled={$mutations.cover}>
        {$mutations.cover ? 'Mengunggah...' : 'Unggah'}
      </button>
    </div>
  </form>
</Modal>

<style>
  .preview { width: 100%; max-height: 220px; object-fit: cover; border-radius: 8px; background: #e2e8f0; }
</style>