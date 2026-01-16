=== ./_components/PublishButton.svelte ===
<script lang="ts">
  import { appState } from '../../_lib/stores/appState';
  
  export let isLoading: boolean = false;
  export let disabled: boolean = false;
  export let onClick: () => void;
  
  $: lang = $appState.currentLang;
</script>

<button class="publish-btn" {disabled} on:click={onClick} class:loading={isLoading} type="button">
  {#if isLoading}
    <svg class="spinner" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" stroke="currentColor" fill="none" stroke-width="3" />
    </svg>
    {lang === 'th' ? 'กำลังบันทึก...' : 'Publishing...'}
  {:else}
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
    </svg>
    {lang === 'th' ? 'เผยแพร่' : 'Publish'}
  {/if}
</button>

<style>
  .publish-btn { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.875rem 2rem; background: var(--primary); color: white; border: none; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
  .publish-btn:hover:not(:disabled) { background: var(--primary-dark); }
  .publish-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .publish-btn svg { width: 20px; height: 20px; }
  .spinner { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>