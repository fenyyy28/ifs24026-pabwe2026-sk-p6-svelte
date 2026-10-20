<script>
  import { onMount } from 'svelte'
  import { users, fetchUsers } from './userStore.js'
  import { resolveAssetUrl, formatDate } from '../../lib/helpers/toolsHelper.js'

  let loading = $state(true)
  let error = $state('')

  onMount(async () => {
    try {
      await fetchUsers()
    } catch (err) {
      error = err.message
    } finally {
      loading = false
    }
  })
</script>

<main class="page">
  <h1>Pengguna</h1>
  <p class="muted">Daftar pengguna yang terdaftar di Delcom Link Tree.</p>

  {#if loading}
    <p>Memuat data...</p>
  {:else if error}
    <p class="alert error">{error}</p>
  {:else if $users.length === 0}
    <p>Belum ada pengguna.</p>
  {:else}
    <div class="user-grid">
      {#each $users as user (user.id)}
        <article class="card user-card">
          <img src={resolveAssetUrl(user.photo)} alt={user.name} />
          <div>
            <strong>{user.name}</strong>
            <div class="muted">{user.email}</div>
            <div class="muted small">Bergabung {formatDate(user.created_at)}</div>
          </div>
        </article>
      {/each}
    </div>
  {/if}
</main>

<style>
  .user-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 1rem; margin-top: 1rem; }
  .user-card { display: flex; align-items: center; gap: 0.9rem; }
  .user-card img { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; background: #e2e8f0; flex-shrink: 0; }
  .small { font-size: 0.8rem; }
</style>