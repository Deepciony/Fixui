=== ./_components/RewardAllocationBar.svelte ===
<script lang="ts">
  import { appState } from '../../_lib/stores/appState';
  
  export let totalSlots: number;
  export let allocated: number;
  
  $: lang = $appState.currentLang;
  $: remaining = totalSlots - allocated;
  $: percentage = totalSlots > 0 ? (allocated / totalSlots) * 100 : 0;
  $: isOverflow = allocated > totalSlots;
</script>

<div class="allocation-bar">
  <div class="bar-header">
    <span class="label">{lang === 'th' ? 'การจัดสรรโควต้า' : 'Quota Allocation'}</span>
    <span class="values">
      {allocated} / {totalSlots}
      <span class="remaining" class:overflow={isOverflow}>
        ({isOverflow ? '+' : ''}{Math.abs(remaining)})
      </span>
    </span>
  </div>
  <div class="progress-bar">
    <div class="progress-fill" class:overflow={isOverflow} style="width: {Math.min(percentage, 100)}%"></div>
  </div>
</div>

<style>
  .allocation-bar { padding: 1.25rem; background: var(--bg-alt); border-radius: 8px; }
  .bar-header { display: flex; justify-content: space-between; margin-bottom: 0.75rem; }
  .label { font-size: 0.875rem; font-weight: 600; color: var(--text); }
  .values { font-size: 0.875rem; font-weight: 600; color: var(--text); }
  .remaining { color: var(--success); }
  .remaining.overflow { color: var(--error); }
  .progress-bar { height: 8px; background: var(--border); border-radius: 4px; overflow: hidden; }
  .progress-fill { height: 100%; background: var(--primary); transition: width 0.3s; }
  .progress-fill.overflow { background: var(--error); }
</style>