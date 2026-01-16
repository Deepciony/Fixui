=== ./capacity/+page.svelte ===
<script lang="ts">
  import { eventForm } from '../../_lib/stores/eventForm';
  import { appState } from '../../_lib/stores/appState';
  import { goto } from '$app/navigation';
  import { t } from '../../_lib/i18n';
  import { validateNumber } from '../../_lib/utils/validation';
  
  $: lang = $appState.currentLang;
  
  let showCalendar = false;
  let selectedDate = '';
  
  function addHolidayDate() {
    if (selectedDate && !$eventForm.holidays.includes(selectedDate)) {
      eventForm.update(state => ({
        ...state,
        holidays: [...state.holidays, selectedDate]
      }));
      selectedDate = '';
    }
  }
  
  function removeHolidayDate(date: string) {
    eventForm.update(state => ({
      ...state,
      holidays: state.holidays.filter(d => d !== date)
    }));
  }
  
  function validateForm(): boolean {
    const errors = new Map($eventForm.validationErrors);
    
    if (!validateNumber($eventForm.totalSlots, 1)) {
      errors.set('totalSlots', lang === 'th' ? 'จำนวนที่นั่งต้องมากกว่า 0' : 'Capacity must be greater than 0');
    } else {
      errors.delete('totalSlots');
    }
    
    if ($eventForm.distanceKm !== null && !validateNumber($eventForm.distanceKm, 0)) {
      errors.set('distanceKm', lang === 'th' ? 'ระยะทางต้องเป็นตัวเลขบวก' : 'Distance must be positive');
    } else {
      errors.delete('distanceKm');
    }
    
    eventForm.update(state => ({
      ...state,
      validationErrors: errors
    }));
    
    return errors.size === 0;
  }
  
  function handleNext() {
    if (validateForm()) {
      goto('/organizer/create-event/rewards');
    }
  }
  
  function handleBack() {
    goto('/organizer/create-event/general');
  }
</script>

<div class="form-section">
  <h3 class="section-title">{t('capacity')}</h3>
  
  <div class="form-group">
    <label for="total-slots">
      {lang === 'th' ? 'จำนวนที่นั่ง' : 'Total Capacity'}
      <span class="required">*</span>
    </label>
    <input
      id="total-slots"
      type="number"
      min="1"
      class:error={$eventForm.validationErrors.has('totalSlots')}
      bind:value={$eventForm.totalSlots}
      placeholder={lang === 'th' ? 'กรอกจำนวนที่นั่ง' : 'Enter capacity'}
    />
    {#if $eventForm.validationErrors.has('totalSlots')}
      <span class="error-message">{$eventForm.validationErrors.get('totalSlots')}</span>
    {/if}
  </div>
  
  <div class="form-group">
    <label for="distance">
      {lang === 'th' ? 'ระยะทาง (กม.)' : 'Distance (km)'}
    </label>
    <input
      id="distance"
      type="number"
      step="0.1"
      min="0"
      class:error={$eventForm.validationErrors.has('distanceKm')}
      bind:value={$eventForm.distanceKm}
      placeholder={lang === 'th' ? 'กรอกระยะทาง' : 'Enter distance'}
    />
    {#if $eventForm.validationErrors.has('distanceKm')}
      <span class="error-message">{$eventForm.validationErrors.get('distanceKm')}</span>
    {/if}
  </div>
  
  <div class="form-group">
    <label>{lang === 'th' ? 'วันหยุด' : 'Holidays'}</label>
    
    <div class="radio-group">
      <label class="radio-label">
        <input
          type="radio"
          bind:group={$eventForm.holidayType}
          value="none"
        />
        <span>{lang === 'th' ? 'ไม่มีวันหยุด' : 'No holidays'}</span>
      </label>
      
      <label class="radio-label">
        <input
          type="radio"
          bind:group={$eventForm.holidayType}
          value="weekends"
        />
        <span>{lang === 'th' ? 'ยกเว้นวันเสาร์-อาทิตย์' : 'Exclude weekends'}</span>
      </label>
      
      <label class="radio-label">
        <input
          type="radio"
          bind:group={$eventForm.holidayType}
          value="specific"
          on:change={() => showCalendar = true}
        />
        <span>{lang === 'th' ? 'เลือกวันเฉพาะ' : 'Select specific dates'}</span>
      </label>
    </div>
    
    {#if $eventForm.holidayType === 'specific'}
      <div class="holiday-selector">
        <div class="date-input-group">
          <input
            type="date"
            bind:value={selectedDate}
            class="date-input"
          />
          <button class="btn-add" on:click={addHolidayDate} type="button">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            {lang === 'th' ? 'เพิ่ม' : 'Add'}
          </button>
        </div>
        
        {#if $eventForm.holidays.length > 0}
          <div class="holiday-list">
            <h4>{lang === 'th' ? 'วันที่เลือก' : 'Selected Dates'}</h4>
            <div class="holiday-tags">
              {#each $eventForm.holidays as date}
                <div class="holiday-tag">
                  <span>{new Date(date).toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US')}</span>
                  <button on:click={() => removeHolidayDate(date)} type="button">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
  
  <div class="form-actions">
    <button class="btn-secondary" on:click={handleBack} type="button">
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
  .form-section {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: var(--shadow-sm);
  }
  
  .section-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text);
    margin: 0 0 2rem;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  .form-group label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 0.5rem;
  }
  
  .required {
    color: var(--error);
  }
  
  .form-group input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 0.875rem;
    transition: all 0.2s;
  }
  
  .form-group input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1);
  }
  
  .form-group input.error {
    border-color: var(--error);
  }
  
  .error-message {
    display: block;
    color: var(--error);
    font-size: 0.75rem;
    margin-top: 0.25rem;
  }
  
  .radio-group {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .radio-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border: 2px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .radio-label:hover {
    border-color: var(--primary);
    background: var(--bg-alt);
  }
  
  .holiday-selector {
    margin-top: 1rem;
    padding: 1rem;
    background: var(--bg-alt);
    border-radius: 8px;
  }
  
  .date-input-group {
    display: flex;
    gap: 0.5rem;
  }
  
  .date-input {
    flex: 1;
  }
  
  .btn-add {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    padding: 0.75rem 1rem;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-add:hover {
    background: var(--primary-dark);
  }
  
  .btn-add svg {
    width: 16px;
    height: 16px;
  }
  
  .holiday-list {
    margin-top: 1rem;
  }
  
  .holiday-list h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 0.75rem;
  }
  
  .holiday-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  
  .holiday-tag {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.375rem 0.75rem;
    background: white;
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 0.875rem;
  }
  
  .holiday-tag button {
    width: 18px;
    height: 18px;
    padding: 0;
    background: transparent;
    border: none;
    color: var(--error);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .holiday-tag button svg {
    width: 14px;
    height: 14px;
  }
  
  .form-actions {
    display: flex;
    justify-content: space-between;
    gap: 1rem;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border);
  }
  
  .btn-secondary,
  .btn-primary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-secondary {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text);
  }
  
  .btn-secondary:hover {
    background: var(--bg-hover);
  }
  
  .btn-primary {
    background: var(--primary);
    color: white;
    border: none;
  }
  
  .btn-primary:hover {
    background: var(--primary-dark);
  }
  
  .btn-secondary svg,
  .btn-primary svg {
    width: 18px;
    height: 18px;
  }
</style>