<script>
  import Modal from '../../../lib/components/Modal.svelte'
  import { changeLinkTree, mutations } from '../states/linkTreesStore.js'

  let { linkTree, onclose } = $props()

  let title = $state(linkTree.title)
  let type = $state(linkTree.type)
  let description = $state(linkTree.description ?? '')
  let error = $state('')

  async function handleSubmit(event) {
    event.preventDefault()
    error = ''
    if (!title.trim()) {
      error = 'Judul wajib diisi'
      return
    }
    try {
      await changeLinkTree(linkTree.id, {
        title: title.trim(),
        type,
        description: description.trim(),
      })
      onclose()
    } catch (err) {
      error = err.message
    }
  }
</script>

<Modal title="Ubah Link Tree" {onclose}>
  <form class="form" onsubmit={handleSubmit}>
    {#if error}<p class="alert error">{error}</p>{/if}
    <label class="field">
      Judul
      <input type="text" bind:value={title} />
    </label>
    <label class="field">
      Tipe
      <select bind:value={type}>
        <option value="public">Publik</option>
        <option value="unlisted">Tidak Terdaftar</option>
        <option value="private">Privat</option>
      </select>
    </label>
    <label class="field">
      Deskripsi
      <textarea rows="3" bind:value={description}></textarea>
    </label>
    <div class="actions">
      <button type="button" class="btn secondary" onclick={onclose}>Batal</button>
      <button type="submit" class="btn" disabled={$mutations.change}>
        {$mutations.change ? 'Menyimpan...' : 'Simpan Perubahan'}
      </button>
    </div>
  </form>
</Modal>ChangeCoverModal.svelte