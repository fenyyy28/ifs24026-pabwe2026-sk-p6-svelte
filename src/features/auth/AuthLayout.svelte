<script>
  import LinkLogo from '../../lib/components/LinkLogo.svelte'

  let { title, children } = $props()
</script>

<div class="auth-page">
  <aside class="auth-intro">
    <LinkLogo size={56} color="#ffffff" />
    <h1>Delcom Link Tree</h1>
    <p>
      Kumpulkan semua tautan pentingmu, mulai dari profil, portofolio, hingga
      proyek, dalam satu halaman yang rapi dan mudah dibagikan.
    </p>
  </aside>

  <main class="auth-card">
    <div class="auth-brand">
      <LinkLogo size={32} color="#4f46e5" />
      <span>Delcom Link Tree</span>
    </div>
    <h2>{title}</h2>
    {@render children()}
  </main>
</div>

<style>
  .auth-page {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
  .auth-intro {
    background: #4f46e5;
    color: #fff;
    padding: 3rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 1rem;
  }
  .auth-intro h1 { margin: 0; font-size: 2rem; }
  .auth-intro p { margin: 0; line-height: 1.6; opacity: 0.9; max-width: 28rem; }
  .auth-card {
    padding: 3rem;
    display: flex;
    flex-direction: column;
    justify-content: center;
    max-width: 26rem;
    width: 100%;
    margin: 0 auto;
  }
  .auth-brand {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
  }
  h2 { margin: 0 0 1.25rem; }
  @media (max-width: 768px) {
    .auth-page { grid-template-columns: 1fr; }
    .auth-intro { padding: 2rem; }
  }
</style>