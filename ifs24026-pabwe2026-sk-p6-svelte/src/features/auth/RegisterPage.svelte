<script>
  import { get } from 'svelte/store'
  import AuthLayout from './AuthLayout.svelte'
  import { useInput } from '../../lib/hooks/useInput.js'
  import { isValidEmail } from '../../lib/helpers/toolsHelper.js'
  import { register } from './authStore.js'
  import { navigate } from '../../router.js'

  const nameInput = useInput('')
  const emailInput = useInput('')
  const passwordInput = useInput('')
  const name = nameInput.value
  const email = emailInput.value
  const password = passwordInput.value

  let error = $state('')
  let success = $state('')
  let loading = $state(false)

  async function handleSubmit(event) {
    event.preventDefault()
    error = ''
    success = ''

    const nameValue = get(name).trim()
    const emailValue = get(email)
    const passwordValue = get(password)

    if (!nameValue) {
      error = 'Nama wajib diisi'
      return
    }
    if (!isValidEmail(emailValue)) {
      error = 'Format email tidak valid'
      return
    }
    if (passwordValue.length < 6) {
      error = 'Password minimal 6 karakter'
      return
    }

    loading = true
    try {
      await register({ name: nameValue, email: emailValue, password: passwordValue })
      success = 'Registrasi berhasil. Mengalihkan ke halaman masuk...'
      setTimeout(() => navigate('/auth/login'), 1200)
    } catch (err) {
      error = err.message
    } finally {
      loading = false
    }
  }
</script>

<AuthLayout title="Daftar">
  <form onsubmit={handleSubmit}>
    {#if error}<p class="error">{error}</p>{/if}
    {#if success}<p class="success">{success}</p>{/if}

    <label>
      Nama
      <input type="text" bind:value={$name} placeholder="Nama lengkap" />
    </label>

    <label>
      Email
      <input type="email" bind:value={$email} placeholder="nama@email.com" />
    </label>

    <label>
      Password
      <input type="password" bind:value={$password} placeholder="Minimal 6 karakter" />
    </label>

    <button type="submit" disabled={loading}>
      {loading ? 'Memproses...' : 'Daftar'}
    </button>

    <p class="switch">
      Sudah punya akun?
      <a href="/auth/login" onclick={(e) => { e.preventDefault(); navigate('/auth/login') }}>Masuk</a>
    </p>
  </form>
</AuthLayout>
