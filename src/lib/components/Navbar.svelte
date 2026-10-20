<script>
  import LinkLogo from './LinkLogo.svelte'
  import { navigate } from '../router/router.js'
  import { logout } from '../../features/auth/authStore.js'
  import { profile } from '../../features/users/userStore.js'
</script>

<header class="navbar">
  <a class="brand" href="/" onclick={(e) => { e.preventDefault(); navigate('/') }}>
    <LinkLogo size={28} color="#4f46e5" />
    <span>Delcom Link Tree</span>
  </a>
  <div class="right">
    {#if $profile}<span class="muted">{$profile.name}</span>{/if}
    <button onclick={logout}>Keluar</button>
  </div>
</header>

<style>
  .navbar { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1.5rem; border-bottom: 1px solid #e2e8f0; background: #fff; }
  .brand { display: flex; align-items: center; gap: 0.5rem; font-weight: 600; color: inherit; text-decoration: none; }
  .right { display: flex; align-items: center; gap: 1rem; }
  button { padding: 0.45rem 0.9rem; border: 1px solid #cbd5e1; border-radius: 8px; background: #fff; cursor: pointer; font: inherit; }
</style>