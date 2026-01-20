=== ./_components/RewardTierCard.svelte ===
<script lang="ts">
  import { appState } from '../../_lib/stores/appState';
  
  export let tier: { name: string; requirement: number | null; quota: number | null };
  export let index: number;
  export let onRemove: () => void;
  export let canRemove: boolean = true;
  
  $: lang = $appState.currentLang;
  const nameId = `reward-name-${index}`;
  const reqId = `reward-req-${index}`;
  const quotaId = `reward-quota-${index}`;
</script>

<div class="tier-card">
  <div class="tier-header">
    <h4 class="tier-title">
      {lang === 'th' ? 'ระดับ' : 'Tier'} {index + 1}
    </h4>
    {#if canRemove}
      <button class="btn-remove" on:click={onRemove} type="button" aria-label={lang === 'th' ? 'ลบระดับรางวัล' : 'Remove tier'}>
        <svg aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    {/if}
  </div>
  
  <div class="tier-fields">
    <div class="field">
      <label for={nameId}>{lang === 'th' ? 'ชื่อรางวัล' : 'Reward Name'} <span class="required">*</span></label>
      <input id={nameId} type="text" bind:value={tier.name} placeholder={lang === 'th' ? 'เช่น Gold' : 'e.g. Gold'} />
    </div>
    
    <div class="field">
      <label for={reqId}>{lang === 'th' ? 'เงื่อนไข (รอบ)' : 'Requirement'} <span class="required">*</span></label>
      <input id={reqId} type="number" min="1" bind:value={tier.requirement} placeholder="0" />
    </div>
    
    <div class="field">
      <label for={quotaId}>{lang === 'th' ? 'โควต้า' : 'Quota'}</label>
      <input id={quotaId} type="number" min="0" bind:value={tier.quota} placeholder={lang === 'th' ? 'ไม่จำกัด' : 'Unlimited'} />
    </div>
  </div>
</div>

<style>
  .tier-card { padding: 1.5rem; border: 2px solid var(--border); border-radius: 12px; background: white; }
  .tier-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  .tier-title { font-size: 1rem; font-weight: 600; color: var(--text); margin: 0; }
  .btn-remove { width: 32px; height: 32px; padding: 0; background: transparent; border: none; color: var(--error); cursor: pointer; transition: opacity 0.2s; }
  .btn-remove:hover { opacity: 0.7; }
  .btn-remove svg { width: 20px; height: 20px; }
  .tier-fields { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 1rem; }
  .field { display: flex; flex-direction: column; gap: 0.5rem; }
  .field label { font-size: 0.875rem; font-weight: 600; color: var(--text); }
  .required { color: var(--error); }
  .field input { padding: 0.75rem; border: 1px solid var(--border); border-radius: 8px; font-size: 0.875rem; }
  .field input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1); }
  @media (max-width: 768px) { .tier-fields { grid-template-columns: 1fr; } }
</style>