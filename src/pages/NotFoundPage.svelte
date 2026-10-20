<script>
  import LinkLogo from '../lib/components/LinkLogo.svelte'
  import { path, navigate } from '../router.js'
  import { isAuthenticated } from '../features/auth/authStore.js'

  function goBack(event) {
    event.preventDefault()
    navigate($isAuthenticated ? '/' : '/auth/login')
  }
</script>

<main class="not-found">
  <LinkLogo size={56} color="#4f46e5" />
  <h1>404</h1>
  <h2>Halaman tidak ditemukan</h2>
  <p class="muted">
    Alamat <code>{$path}</code> tidak tersedia di Delcom Link Tree.
  </p>
  <a class="btn" href={$isAuthenticated ? '/' : '/auth/login'} onclick={goBack}>
    {$isAuthenticated ? 'Kembali ke Semua Link Tree' : 'Kembali ke halaman masuk'}
  </a>
</main>

<style>
  .not-found { min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; padding: 2rem; text-align: center; }
  h1 { margin: 0.5rem 0 0; font-size: 4rem; color: #4f46e5; line-height: 1; }
  h2 { margin: 0; }
  p { margin: 0 0 1rem; }
  code { background: #f1f5f9; padding: 0.1rem 0.4rem; border-radius: 4px; }
  .btn { display: inline-block; padding: 0.7rem 1.2rem; text-decoration: none; }
</style>