<script>
  import { onMount } from 'svelte'
  import { get } from 'svelte/store'
  import Navbar from '../../../lib/components/Navbar.svelte'
  import { path, navigate } from '../../../lib/router/router.js'
  import { profile, fetchProfile } from '../../users/userStore.js'

  let { children } = $props()

  const menu = [
    { to: '/', label: 'Semua Link Tree' },
    { to: '/users', label: 'Pengguna' },
    { to: '/profile', label: 'Profil' },
  ]

  function isActive(to, current) {
    return to === '/' ? current === '/' || current.startsWith('/link-trees') : current === to
  }

  onMount(() => {
    if (!get(profile)) fetchProfile().catch(() => {})
  })
</script>

<div class="shell">
  <Navbar />
  <div class="body">
    <aside class="sidebar">
      {#each menu as item}
        <a
          href={item.to}
          class:active={isActive(item.to, $path)}
          onclick={(e) => { e.preventDefault(); navigate(item.to) }}
        >
          {item.label}
        </a>
      {/each}
    </aside>
    <div class="content">
      {@render children()}
    </div>
  </div>
</div>

<style>
  .shell { min-height: 100vh; display: flex; flex-direction: column; }
  .body { flex: 1; display: flex; }
  .sidebar { width: 220px; padding: 1rem; border-right: 1px solid #e2e8f0; display: flex; flex-direction: column; gap: 0.25rem; background: #f8fafc; }
  .sidebar a { padding: 0.6rem 0.8rem; border-radius: 8px; color: #475569; text-decoration: none; }
  .sidebar a:hover { background: #eef2ff; }
  .sidebar a.active { background: #4f46e5; color: #fff; }
  .content { flex: 1; min-width: 0; }
  @media (max-width: 768px) {
    .body { flex-direction: column; }
    .sidebar { width: auto; flex-direction: row; overflow-x: auto; border-right: 0; border-bottom: 1px solid #e2e8f0; }
    .sidebar a { white-space: nowrap; }
  }
</style>