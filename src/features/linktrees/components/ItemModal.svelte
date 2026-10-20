<script>
  import Modal from '../../../lib/components/Modal.svelte'
  import { isValidUrl } from '../../../lib/helpers/toolsHelper.js'
  import { addLinkItem, changeLinkItem, mutations } from '../states/linkTreesStore.js'

  let { linkTreeId, item = null, onclose } = $props()

  let title = $state(item?.title ?? '')
  let url = $state(item?.url ?? '')
  let error = $state('')

  async function handleSubmit(event) {
    event.preventDefault()
    error = ''
    if (!title.trim()) {
      error = 'Judul tautan wajib diisi'
      return
    }
    if (!isValidUrl(url.trim())) {
      error = 'URL tidak valid (contoh: https://delcom.org)'
      return
    }
    const payload = { title: title.trim(), url: url.trim() }
    try {
      if (item) await changeLinkItem(linkTreeId, item.id, payload)
      else await addLinkItem(linkTreeId, payload)
      onclose()
    } catch (err) {
      error = err.message
    }
  }
</script>

<Modal title={item ? 'Ubah Tautan' : 'Tambah Tautan'} {onclose}>
  <form class="form" onsubmit={handleSubmit}>
    {#if error}<p class="alert error">{error}</p>{/if}
    <label class="field">
      Judul
      <input type="text" bind:value={title} placeholder="Contoh: Dasar Java" />
    </label>
    <label class="field">
      URL
      <input type="text" bind:value={url} placeholder="https://delcom.org" />
    </label>
    <div class="actions">
      <button type="button" class="btn secondary" onclick={onclose}>Batal</button>
      <button type="submit" class="btn" disabled={$mutations.item}>
        {$mutations.item ? 'Menyimpan...' : 'Simpan'}
      </button>
    </div>
  </form>
</Modal>