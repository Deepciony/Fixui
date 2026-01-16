=== ./_components/ValidationAlert.svelte ===
<script lang="ts">
  export let errors: Map<string, string>;
</script>

{#if errors.size > 0}
  <div class="validation-alert">
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
    <div class="alert-content">
      <h4>{errors.size} {errors.size === 1 ? 'Error' : 'Errors'} Found</h4>
      <ul>
        {#each [...errors.entries()] as [field, message]}
          <li>{message}</li>
        {/each}
      </ul>
    </div>
  </div>
{/if}

<style>
  .validation-alert { display: flex; gap: 1rem; padding: 1rem; background: #fee2e2; border: 1px solid #fca5a5; border-radius: 8px; margin-bottom: 1.5rem; }
  .validation-alert svg { width: 24px; height: 24px; color: #991b1b; flex-shrink: 0; margin-top: 0.125rem; }
  .alert-content h4 { font-size: 0.875rem; font-weight: 600; color: #991b1b; margin: 0 0 0.5rem; }
  .alert-content ul { margin: 0; padding-left: 1.25rem; color: #7f1d1d; }
  .alert-content li { font-size: 0.875rem; margin-bottom: 0.25rem; }
</style>