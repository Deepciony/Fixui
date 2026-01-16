=== verify-code/./_components/AutoToggle.svelte ===
<script lang="ts">
  import { appState } from '../../_lib/stores/appState';
  
  export let enabled: boolean;
  
  $: lang = $appState.currentLang;
</script>

<div class="auto-toggle">
  <label class="toggle-label">
    <input 
      type="checkbox" 
      class="toggle-input"
      bind:checked={enabled}
    />
    <span class="toggle-slider"></span>
    <span class="toggle-text">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
      {lang === 'th' ? 'โหมดอัตโนมัติ' : 'Auto Mode'}
    </span>
  </label>
</div>

<style>
  .toggle-label { display: flex; align-items: center; gap: 0.75rem; cursor: pointer; padding: 0.75rem 1rem; background: white; border: 1px solid var(--border); border-radius: 8px; transition: all 0.2s; }
  .toggle-label:hover { border-color: var(--primary); }
  
  .toggle-input { display: none; }
  
  .toggle-slider { position: relative; width: 44px; height: 24px; background: var(--border); border-radius: 12px; transition: all 0.3s; flex-shrink: 0; }
  .toggle-slider::before { content: ''; position: absolute; width: 18px; height: 18px; left: 3px; top: 3px; background: white; border-radius: 50%; transition: all 0.3s; }
  
  .toggle-input:checked + .toggle-slider { background: var(--primary); }
  .toggle-input:checked + .toggle-slider::before { transform: translateX(20px); }
  
  .toggle-text { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; font-weight: 600; color: var(--text); }
  .toggle-text svg { width: 16px; height: 16px; }
</style>