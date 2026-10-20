<script>
  let { title, onclose, children } = $props()
</script>

<svelte:window onkeydown={(e) => e.key === 'Escape' && onclose()} />

<div
  class="backdrop"
  role="presentation"
  onclick={(e) => { if (e.target === e.currentTarget) onclose() }}
>
  <div class="modal" role="dialog" aria-modal="true" aria-label={title}>
    <header>
      <h2>{title}</h2>
      <button type="button" class="close" onclick={onclose} aria-label="Tutup">×</button>
    </header>
    {@render children()}
  </div>
</div>

<style>
  .backdrop { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.5); display: flex; align-items: center; justify-content: center; padding: 1rem; z-index: 50; }
  .modal { background: #fff; border-radius: 12px; padding: 1.25rem; width: 100%; max-width: 460px; max-height: 90vh; overflow-y: auto; }
  header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  h2 { margin: 0; font-size: 1.15rem; }
  .close { border: 0; background: none; font-size: 1.6rem; line-height: 1; cursor: pointer; color: #64748b; }
</style>