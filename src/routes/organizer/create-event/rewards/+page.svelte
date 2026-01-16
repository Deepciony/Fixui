=== ./rewards/+page.svelte ===
<script lang="ts">
  import { eventForm } from '../../_lib/stores/eventForm';
  import { appState } from '../../_lib/stores/appState';
  import { goto } from '$app/navigation';
  import { t } from '../../_lib/i18n';
  import { calculateTotalQuota, validateQuotaAllocation } from '../../_lib/utils/calculations';
  
  $: lang = $appState.currentLang;
  $: totalAllocated = calculateTotalQuota($eventForm.rewards);
  $: quotaValidation = $eventForm.totalSlots ? validateQuotaAllocation($eventForm.rewards, $eventForm.totalSlots) : { valid: true, exceeded: 0 };
  $: remaining = $eventForm.totalSlots ? $eventForm.totalSlots - totalAllocated : 0;
  
  function addTier() {
    eventForm.update(state => ({
      ...state,
      rewards: [...state.rewards, { name: '', requirement: null, quota: null }]
    }));
  }
  
  function removeTier(index: number) {
    eventForm.update(state => ({
      ...state,
      rewards: state.rewards.filter((_, i) => i !== index)
    }));
  }
  
  function validateForm(): boolean {
    const errors = new Map($eventForm.validationErrors);
    
    if ($eventForm.rewards.length === 0) {
      errors.set('rewards', lang === 'th' ? 'กรุณาเพิ่มอย่างน้อย 1 ระดับรางวัล' : 'Add at least 1 reward tier');
      eventForm.update(state => ({ ...state, validationErrors: errors }));
      return false;
    }
    
    for (let i = 0; i < $eventForm.rewards.length; i++) {
      const reward = $eventForm.rewards[i];
      if (!reward.name?.trim()) {
        errors.set(`reward-${i}-name`, lang === 'th' ? 'กรุณากรอกชื่อรางวัล' : 'Reward name required');
      }
      if (!reward.requirement || reward.requirement <= 0) {
        errors.set(`reward-${i}-req`, lang === 'th' ? 'กรุณากรอกเงื่อนไข' : 'Requirement required');
      }
    }
    
    if (!quotaValidation.valid) {
      errors.set('quota', lang === 'th' ? `โควต้าเกิน ${quotaValidation.exceeded} ที่นั่ง` : `Quota exceeds by ${quotaValidation.exceeded}`);
    } else {
      errors.delete('quota');
    }
    
    eventForm.update(state => ({ ...state, validationErrors: errors }));
    return errors.size === 0;
  }
  
  function handleNext() {
    if (validateForm()) {
      goto('/organizer/create-event/summary');
    }
  }
</script>

<div class="form-section">
  <h3 class="section-title">{t('rewards')}</h3>
  
  <div class="quota-summary">
    <div class="quota-stat">
      <span class="label">{lang === 'th' ? 'ที่นั่งทั้งหมด' : 'Total Capacity'}</span>
      <span class="value">{$eventForm.totalSlots || 0}</span>
    </div>
    <div class="quota-stat">
      <span class="label">{lang === 'th' ? 'จัดสรรแล้ว' : 'Allocated'}</span>
      <span class="value">{totalAllocated}</span>
    </div>
    <div class="quota-stat" class:warning={remaining < 0}>
      <span class="label">{lang === 'th' ? 'คงเหลือ' : 'Remaining'}</span>
      <span class="value">{remaining}</span>
    </div>
  </div>
  
  {#if !quotaValidation.valid}
    <div class="alert error">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span>{lang === 'th' ? `โควต้าเกิน ${quotaValidation.exceeded} ที่นั่ง` : `Quota exceeds capacity by ${quotaValidation.exceeded}`}</span>
    </div>
  {/if}
  
  <div class="rewards-list">
    {#each $eventForm.rewards as reward, i}
      <div class="reward-tier">
        <div class="tier-header">
          <h4>{lang === 'th' ? 'ระดับ' : 'Tier'} {i + 1}</h4>
          {#if $eventForm.rewards.length > 1}
            <button class="btn-remove" on:click={() => removeTier(i)} type="button">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          {/if}
        </div>
        
        <div class="tier-fields">
          <div class="form-group">
            <label>{lang === 'th' ? 'ชื่อรางวัล' : 'Reward Name'} <span class="required">*</span></label>
            <input
              type="text"
              bind:value={reward.name}
              class:error={$eventForm.validationErrors.has(`reward-${i}-name`)}
              placeholder={lang === 'th' ? 'เช่น Gold, Silver' : 'e.g. Gold, Silver'}
            />
          </div>
          
          <div class="form-group">
            <label>{lang === 'th' ? 'เงื่อนไข (รอบ)' : 'Requirement (rounds)'} <span class="required">*</span></label>
            <input
              type="number"
              min="1"
              bind:value={reward.requirement}
              class:error={$eventForm.validationErrors.has(`reward-${i}-req`)}
              placeholder="0"
            />
          </div>
          
          <div class="form-group">
            <label>{lang === 'th' ? 'โควต้า' : 'Quota'}</label>
            <input
              type="number"
              min="0"
              bind:value={reward.quota}
              placeholder={lang === 'th' ? 'ไม่จำกัด' : 'Unlimited'}
            />
          </div>
        </div>
      </div>
    {/each}
  </div>
  
  <button class="btn-add-tier" on:click={addTier} type="button">
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
    </svg>
    {lang === 'th' ? 'เพิ่มระดับรางวัล' : 'Add Reward Tier'}
  </button>
  
  <div class="form-actions">
    <button class="btn-secondary" on:click={() => goto('/organizer/create-event/capacity')} type="button">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      {t('back')}
    </button>
    <button class="btn-primary" on:click={handleNext} type="button">
      {t('next')}
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </div>
</div>

<style>
  .form-section { background: white; border-radius: 12px; padding: 2rem; box-shadow: var(--shadow-sm); }
  .section-title { font-size: 1.5rem; font-weight: 700; color: var(--text); margin: 0 0 2rem; }
  .quota-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; padding: 1.5rem; background: var(--bg-alt); border-radius: 8px; }
  .quota-stat { text-align: center; }
  .quota-stat.warning .value { color: var(--error); }
  .quota-stat .label { display: block; font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.25rem; }
  .quota-stat .value { font-size: 1.5rem; font-weight: 700; color: var(--primary); }
  .alert { display: flex; align-items: center; gap: 0.75rem; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; }
  .alert.error { background: #fee2e2; color: #991b1b; }
  .alert svg { width: 20px; height: 20px; flex-shrink: 0; }
  .rewards-list { display: flex; flex-direction: column; gap: 1rem; margin-bottom: 1rem; }
  .reward-tier { padding: 1.5rem; border: 2px solid var(--border); border-radius: 8px; }
  .tier-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
  .tier-header h4 { font-size: 1rem; font-weight: 600; color: var(--text); margin: 0; }
  .btn-remove { width: 32px; height: 32px; padding: 0; background: transparent; border: none; color: var(--error); cursor: pointer; }
  .btn-remove svg { width: 20px; height: 20px; }
  .tier-fields { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 1rem; }
  .form-group { margin: 0; }
  .form-group label { display: block; font-size: 0.875rem; font-weight: 600; color: var(--text); margin-bottom: 0.5rem; }
  .required { color: var(--error); }
  .form-group input { width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 8px; font-size: 0.875rem; }
  .form-group input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1); }
  .form-group input.error { border-color: var(--error); }
  .btn-add-tier { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: var(--bg-alt); border: 2px dashed var(--border); border-radius: 8px; font-size: 0.875rem; font-weight: 600; color: var(--text-muted); cursor: pointer; width: 100%; justify-content: center; }
  .btn-add-tier:hover { border-color: var(--primary); background: var(--bg-hover); color: var(--primary); }
  .btn-add-tier svg { width: 18px; height: 18px; }
  .form-actions { display: flex; justify-content: space-between; gap: 1rem; margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border); }
  .btn-secondary, .btn-primary { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
  .btn-secondary { background: transparent; border: 1px solid var(--border); color: var(--text); }
  .btn-primary { background: var(--primary); color: white; border: none; }
  .btn-secondary svg, .btn-primary svg { width: 18px; height: 18px; }
  @media (max-width: 768px) { .quota-summary { grid-template-columns: 1fr; } .tier-fields { grid-template-columns: 1fr; } }
</style>