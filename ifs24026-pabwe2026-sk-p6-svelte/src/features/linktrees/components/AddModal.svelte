<script>
  import Modal from '../../../lib/components/Modal.svelte'
  import { navigate } from '../../../lib/router/router.js'
  import { addLinkTree, mutations } from '../states/linkTreesStore.js'

  let { onclose } = $props()

  let title = $state('')
  let type = $state('public')
  let description = $state('')
  let error = $state('')

  async function handleSubmit(event) {
    event.preventDefault()
    error = ''
    if (!title.trim()) {
      error = 'Judul wajib diisi'
      return
    }
    try {
      const id = await addLinkTree({
        title: title.trim(),
        type,
        description: description.trim(),
      })
      onclose()
      navigate(`/link-trees/${id}`)
    } catch (err) {
      error = err.message
    }
  }
</script>

<Modal title="Tambah Link Tree" {onclose}>
  <form class="form" onsubmit={handleSubmit}>
    {#if error}<p class="alert error">{error}</p>{/if}
    <label class="field">
      Judul
      <input type="text" bind:value={title} placeholder="Contoh: Kursus Ku" />
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
      <textarea rows="3" bind:value={description} placeholder="Deskripsi singkat"></textarea>
    </label>
    <div class="actions">
      <button type="button" class="btn secondary" onclick={onclose}>Batal</button>
      <button type="submit" class="btn" disabled={$mutations.add}>
        {$mutations.add ? 'Menyimpan...' : 'Simpan'}
      </button>
    </div>
  </form>
</Modal>