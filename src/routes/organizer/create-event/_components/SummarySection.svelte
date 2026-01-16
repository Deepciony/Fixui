=== ./_components/SummarySection.svelte ===
<script lang="ts">
  export let title: string;
</script>

<div class="summary-section">
  <h4 class="section-title">{title}</h4>
  <div class="section-content">
    <slot />
  </div>
</div>

<style>
  .summary-section { margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid var(--border); }
  .summary-section:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
  .section-title { font-size: 1rem; font-weight: 600; color: var(--text); margin: 0 0 1rem; }
  .section-content { display: flex; flex-direction: column; gap: 0.75rem; }
</style>