<script>
  import { get } from 'svelte/store'
  import AuthLayout from './AuthLayout.svelte'
  import { useInput } from '../../lib/hooks/useInput.js'
  import { isValidEmail } from '../../lib/helpers/toolsHelper.js'
  import { login } from './authStore.js'
  import { navigate } from '../../router.js'

  const emailInput = useInput('')
  const passwordInput = useInput('')
  const email = emailInput.value
  const password = passwordInput.value

  let error = $state('')
  let loading = $state(false)

  async function handleSubmit(event) {
    event.preventDefault()
    error = ''

    const emailValue = get(email)
    const passwordValue = get(password)

    if (!isValidEmail(emailValue)) {
      error = 'Format email tidak valid'
      return
    }
    if (!passwordValue) {
      error = 'Password wajib diisi'
      return
    }

    loading = true
    try {
      await login({ email: emailValue, password: passwordValue })
      navigate('/', { replace: true })
    } catch (err) {
      error = err.message
    } finally {
      loading = false
    }
  }
</script>

<AuthLayout title="Masuk">
  <form onsubmit={handleSubmit}>
    {#if error}<p class="error">{error}</p>{/if}

    <label>
      Email
      <input id="login-email-input" type="email" autocomplete="email" bind:value={$email} placeholder="nama@email.com" />
    </label>

    <label>
      Password
      <input id="login-password-input" type="password" autocomplete="current-password" bind:value={$password} placeholder="Password" />
    </label>

    <button id="login-submit-button" type="submit" disabled={loading}>
      {loading ? 'Memproses...' : 'Masuk'}
    </button>

    <p class="switch">
      Belum punya akun?
      <a href="/auth/register" onclick={(e) => { e.preventDefault(); navigate('/auth/register') }}>Daftar</a>
    </p>
  </form>
</AuthLayout>
