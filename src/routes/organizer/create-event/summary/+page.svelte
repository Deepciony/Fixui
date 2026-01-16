=== ./summary/+page.svelte ===
<script lang="ts">
  import { eventForm } from '../../_lib/stores/eventForm';
  import { appState } from '../../_lib/stores/appState';
  import { goto } from '$app/navigation';
  import { t } from '../../_lib/i18n';
  import api from '../../_lib/api/client';
  import { endpoints } from '../../_lib/api/endpoints';
  import { createUTCISOFromBangkok } from '../../_lib/utils/dateTime';
  import SuccessAlert from '../../_lib/components/SuccessAlert.svelte';
  import ErrorMessage from '../../_lib/components/ErrorMessage.svelte';
  
  $: lang = $appState.currentLang;
  
  let isSubmitting = false;
  let showSuccess = false;
  let errorMessage = '';
  
  async function handlePublish() {
    if (isSubmitting) return;
    
    isSubmitting = true;
    errorMessage = '';
    
    try {
      const formData = new FormData();
      
      formData.append('title', $eventForm.title);
      formData.append('description', $eventForm.description);
      formData.append('location', $eventForm.location);
      formData.append('eventType', $eventForm.eventType);
      formData.append('totalSlots', String($eventForm.totalSlots));
      
      if ($eventForm.distanceKm) {
        formData.append('distanceKm', String($eventForm.distanceKm));
      }
      
      const startDateStr = `${$eventForm.startDate.year}-${$eventForm.startDate.month.padStart(2, '0')}-${$eventForm.startDate.day.padStart(2, '0')}`;
      const endDateStr = `${$eventForm.endDate.year}-${$eventForm.endDate.month.padStart(2, '0')}-${$eventForm.endDate.day.padStart(2, '0')}`;
      
      formData.append('startDate', createUTCISOFromBangkok(startDateStr, $eventForm.startTime));
      formData.append('endDate', createUTCISOFromBangkok(endDateStr, $eventForm.endTime));
      
      if ($eventForm.imageFile) {
        formData.append('image', $eventForm.imageFile);
      }
      
      formData.append('rewards', JSON.stringify($eventForm.rewards));
      formData.append('holidays', JSON.stringify($eventForm.holidays));
      formData.append('holidayType', $eventForm.holidayType);
      
      if ($eventForm.editingEventId) {
        await api.put(endpoints.events.update($eventForm.editingEventId), formData);
      } else {
        await api.post(endpoints.events.create, formData);
      }
      
      showSuccess = true;
      eventForm.reset();
      
      setTimeout(() => {
        goto('/organizer/events');
      }, 1500);
      
    } catch (error: any) {
      errorMessage = error.response?.data?.message || 'Failed to save event';
      console.error('Error saving event:', error);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<div class="form-section">
  <h3 class="section-title">{t('summary')}</h3>
  
  {#if showSuccess}
    <SuccessAlert 
      message={lang === 'th' ? 'บันทึกกิจกรรมสำเร็จ' : 'Event saved successfully'}
      autoDismiss={true}
    />
  {/if}
  
  {#if errorMessage}
    <ErrorMessage message={errorMessage} onDismiss={() => errorMessage = ''} />
  {/if}
  
  <div class="summary-section">
    <h4>{lang === 'th' ? 'ข้อมูลพื้นฐาน' : 'Basic Information'}</h4>
    <dl>
      <dt>{lang === 'th' ? 'ชื่อกิจกรรม' : 'Event Name'}</dt>
      <dd>{$eventForm.title}</dd>
      <dt>{lang === 'th' ? 'สถานที่' : 'Location'}</dt>
      <dd>{$eventForm.location}</dd>
      <dt>{lang === 'th' ? 'ประเภท' : 'Type'}</dt>
      <dd>{$eventForm.eventType === 'single_day' ? (lang === 'th' ? 'วันเดียว' : 'Single Day') : (lang === 'th' ? 'หลายวัน' : 'Multi Day')}</dd>
    </dl>
  </div>
  
  <div class="summary-section">
    <h4>{lang === 'th' ? 'จำนวนและระยะทาง' : 'Capacity & Distance'}</h4>
    <dl>
      <dt>{lang === 'th' ? 'จำนวนที่นั่ง' : 'Total Capacity'}</dt>
      <dd>{$eventForm.totalSlots}</dd>
      <dt>{lang === 'th' ? 'ระยะทาง' : 'Distance'}</dt>
      <dd>{$eventForm.distanceKm ? `${$eventForm.distanceKm} km` : '-'}</dd>
    </dl>
  </div>
  
  <div class="summary-section">
    <h4>{lang === 'th' ? 'รางวัล' : 'Rewards'}</h4>
    <div class="rewards-summary">
      {#each $eventForm.rewards as reward, i}
        <div class="reward-item">
          <span class="tier">Tier {i + 1}</span>
          <span class="name">{reward.name}</span>
          <span class="req">{reward.requirement} {lang === 'th' ? 'รอบ' : 'rounds'}</span>
          <span class="quota">{reward.quota || (lang === 'th' ? 'ไม่จำกัด' : 'Unlimited')}</span>
        </div>
      {/each}
    </div>
  </div>
  
  <div class="form-actions">
    <button class="btn-secondary" on:click={() => goto('/organizer/create-event/rewards')} type="button" disabled={isSubmitting}>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      {t('back')}
    </button>
    <button class="btn-primary" on:click={handlePublish} type="button" disabled={isSubmitting}>
      {isSubmitting ? (lang === 'th' ? 'กำลังบันทึก...' : 'Saving...') : t('publish')}
    </button>
  </div>
</div>

<style>
  .form-section { background: white; border-radius: 12px; padding: 2rem; box-shadow: var(--shadow-sm); }
  .section-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 2rem; }
  .summary-section { margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid var(--border); }
  .summary-section:last-of-type { border-bottom: none; }
  .summary-section h4 { font-size: 1rem; font-weight: 600; margin-bottom: 1rem; }
  .summary-section dl { display: grid; grid-template-columns: 150px 1fr; gap: 0.75rem 1rem; }
  .summary-section dt { font-weight: 600; color: var(--text-muted); }
  .summary-section dd { margin: 0; }
  .rewards-summary { display: flex; flex-direction: column; gap: 0.5rem; }
  .reward-item { display: grid; grid-template-columns: 80px 1fr 120px 120px; gap: 1rem; padding: 0.75rem; background: var(--bg-alt); border-radius: 6px; }
  .form-actions { display: flex; justify-content: space-between; gap: 1rem; margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border); }
  .btn-secondary, .btn-primary { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; }
  .btn-secondary { background: transparent; border: 1px solid var(--border); color: var(--text); }
  .btn-primary { background: var(--primary); color: white; border: none; }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
</style>