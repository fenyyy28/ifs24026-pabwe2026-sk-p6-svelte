<script>
  import { onMount } from 'svelte'
  import {
    profile,
    fetchProfile,
    updateProfile,
    uploadPhoto,
    changePassword,
  } from './userStore.js'
  import { isValidEmail, resolveAssetUrl } from '../../lib/helpers/toolsHelper.js'

  let name = $state('')
  let email = $state('')
  let currentPassword = $state('')
  let newPassword = $state('')
  let confirmation = $state('')

  let loading = $state(true)
  let loadError = $state('')
  let savingProfile = $state(false)
  let uploading = $state(false)
  let savingPassword = $state(false)

  let profileAlert = $state({ type: '', text: '' })
  let photoAlert = $state({ type: '', text: '' })
  let passwordAlert = $state({ type: '', text: '' })

  onMount(async () => {
    try {
      const user = await fetchProfile()
      name = user.name
      email = user.email
    } catch (err) {
      loadError = err.message
    } finally {
      loading = false
    }
  })

  async function handleProfile(event) {
    event.preventDefault()
    profileAlert = { type: '', text: '' }

    if (!name.trim()) {
      profileAlert = { type: 'error', text: 'Nama wajib diisi' }
      return
    }
    if (!isValidEmail(email)) {
      profileAlert = { type: 'error', text: 'Format email tidak valid' }
      return
    }

    savingProfile = true
    try {
      await updateProfile({ name: name.trim(), email })
      profileAlert = { type: 'success', text: 'Profil berhasil diperbarui' }
    } catch (err) {
      profileAlert = { type: 'error', text: err.message }
    } finally {
      savingProfile = false
    }
  }

  async function handlePhoto(event) {
    const input = event.target
    const file = input.files?.[0]
    if (!file) return
    photoAlert = { type: '', text: '' }

    if (!file.type.startsWith('image/')) {
      photoAlert = { type: 'error', text: 'File harus berupa gambar' }
      input.value = ''
      return
    }

    uploading = true
    try {
      await uploadPhoto(file)
      photoAlert = { type: 'success', text: 'Foto profil berhasil diubah' }
    } catch (err) {
      photoAlert = { type: 'error', text: err.message }
    } finally {
      uploading = false
      input.value = ''
    }
  }

  async function handlePassword(event) {
    event.preventDefault()
    passwordAlert = { type: '', text: '' }

    if (!currentPassword) {
      passwordAlert = { type: 'error', text: 'Kata sandi saat ini wajib diisi' }
      return
    }
    if (newPassword.length < 6) {
      passwordAlert = { type: 'error', text: 'Kata sandi baru minimal 6 karakter' }
      return
    }
    if (newPassword !== confirmation) {
      passwordAlert = { type: 'error', text: 'Konfirmasi kata sandi tidak sama' }
      return
    }

    savingPassword = true
    try {
      await changePassword({ password: currentPassword, newPassword, confirmation })
      passwordAlert = { type: 'success', text: 'Kata sandi berhasil diubah' }
      currentPassword = ''
      newPassword = ''
      confirmation = ''
    } catch (err) {
      passwordAlert = { type: 'error', text: err.message }
    } finally {
      savingPassword = false
    }
  }
</script>

<main class="page">
  <h1>Profil Saya</h1>

  {#if loading}
    <p>Memuat data...</p>
  {:else if loadError}
    <p class="alert error">{loadError}</p>
  {:else}
    <section class="card">
      <h2>Foto Profil</h2>
      <div class="photo-row">
        <img src={resolveAssetUrl($profile?.photo)} alt="Foto profil" />
        <div>
          <input type="file" accept="image/*" onchange={handlePhoto} disabled={uploading} />
          {#if uploading}<p class="muted">Mengunggah...</p>{/if}
        </div>
      </div>
      {#if photoAlert.text}<p class={'alert ' + photoAlert.type}>{photoAlert.text}</p>{/if}
    </section>

    <section class="card">
      <h2>Data Profil</h2>
      <form onsubmit={handleProfile}>
        {#if profileAlert.text}<p class={'alert ' + profileAlert.type}>{profileAlert.text}</p>{/if}
        <label>
          Nama
          <input type="text" bind:value={name} />
        </label>
        <label>
          Email
          <input type="email" bind:value={email} />
        </label>
        <button type="submit" class="btn" disabled={savingProfile}>
          {savingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </form>
    </section>

    <section class="card">
      <h2>Ubah Kata Sandi</h2>
      <form onsubmit={handlePassword}>
        {#if passwordAlert.text}<p class={'alert ' + passwordAlert.type}>{passwordAlert.text}</p>{/if}
        <label>
          Kata sandi saat ini
          <input type="password" bind:value={currentPassword} />
        </label>
        <label>
          Kata sandi baru
          <input type="password" bind:value={newPassword} placeholder="Minimal 6 karakter" />
        </label>
        <label>
          Konfirmasi kata sandi baru
          <input type="password" bind:value={confirmation} />
        </label>
        <button type="submit" class="btn" disabled={savingPassword}>
          {savingPassword ? 'Menyimpan...' : 'Ubah Kata Sandi'}
        </button>
      </form>
    </section>
  {/if}
</main>

<style>
  .photo-row { display: flex; align-items: center; gap: 1rem; }
  .photo-row img { width: 88px; height: 88px; border-radius: 50%; object-fit: cover; background: #e2e8f0; }
  h2 { margin: 0 0 1rem; font-size: 1.1rem; }
  form { display: flex; flex-direction: column; gap: 1rem; }
  label { display: flex; flex-direction: column; gap: 0.35rem; font-size: 0.9rem; }
  input[type='text'], input[type='email'], input[type='password'] {
    padding: 0.65rem 0.75rem; border: 1px solid #cbd5e1; border-radius: 8px; font: inherit;
  }
</style>