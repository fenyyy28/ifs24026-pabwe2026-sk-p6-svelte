<script>
  import { path, navigate, resolveRoute } from './router.js'
  import { isAuthenticated } from './features/auth/authStore.js'
  import LoginPage from './features/auth/LoginPage.svelte'
  import RegisterPage from './features/auth/RegisterPage.svelte'
  import UsersPage from './features/users/UsersPage.svelte'
  import ProfilePage from './features/users/ProfilePage.svelte'
  import LinkTreeLayout from './features/linktrees/layouts/LinkTreeLayout.svelte'
  import HomePage from './features/linktrees/pages/HomePage.svelte'
  import DetailPage from './features/linktrees/pages/DetailPage.svelte'
  import NotFoundPage from './pages/NotFoundPage.svelte'

  let resolved = $derived(resolveRoute($path, $isAuthenticated))
  let name = $derived(resolved.route?.name)

  // Pengalihan akibat penjaga rute (belum login / sudah login)
  $effect(() => {
    if (resolved.redirect) navigate(resolved.redirect, { replace: true })
  })
</script>

{#if resolved.redirect}
  <!-- menunggu pengalihan -->
{:else if name === 'login'}
  <LoginPage />
{:else if name === 'register'}
  <RegisterPage />
{:else if name === 'not-found'}
  <NotFoundPage />
{:else}
  <LinkTreeLayout>
    {#if name === 'detail'}
      <DetailPage linkTreeId={resolved.params.linkTreeId} />
    {:else if name === 'users'}
      <UsersPage />
    {:else if name === 'profile'}
      <ProfilePage />
    {:else}
      <HomePage />
    {/if}
  </LinkTreeLayout>
{/if}