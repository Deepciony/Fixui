=== ./_components/HolidaySelector.svelte ===
<script lang="ts">
  import { appState } from '../../_lib/stores/appState';
  
  export let holidayType: 'none' | 'weekends' | 'specific';
  export let holidays: string[] = [];
  
  $: lang = $appState.currentLang;
  
  let selectedDate = '';
  
  function addHoliday() {
    if (selectedDate && !holidays.includes(selectedDate)) {
      holidays = [...holidays, selectedDate];
      selectedDate = '';
    }
  }
  
  function removeHoliday(date: string) {
    holidays = holidays.filter(d => d !== date);
  }
  
  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }
</script>

<div class="holiday-selector">
  <h4 class="title">
    {lang === 'th' ? 'วันหยุด' : 'Holidays'}
  </h4>
  
  <div class="options">
    <label class="option" class:selected={holidayType === 'none'}>
      <input type="radio" bind:group={holidayType} value="none" hidden />
      <div class="option-icon">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
      <span>{lang === 'th' ? 'ไม่มีวันหยุด' : 'No holidays'}</span>
    </label>
    
    <label class="option" class:selected={holidayType === 'weekends'}>
      <input type="radio" bind:group={holidayType} value="weekends" hidden />
      <div class="option-icon">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <span>{lang === 'th' ? 'ยกเว้นวันเสาร์-อาทิตย์' : 'Exclude weekends'}</span>
    </label>
    
    <label class="option" class:selected={holidayType === 'specific'}>
      <input type="radio" bind:group={holidayType} value="specific" hidden />
      <div class="option-icon">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <span>{lang === 'th' ? 'เลือกวันเฉพาะ' : 'Select specific dates'}</span>
    </label>
  </div>
  
  {#if holidayType === 'specific'}
    <div class="date-selection">
      <div class="input-group">
        <input
          type="date"
          class="date-input"
          bind:value={selectedDate}
        />
        <button class="btn-add" on:click={addHoliday} type="button">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          {lang === 'th' ? 'เพิ่ม' : 'Add'}
        </button>
      </div>
      
      {#if holidays.length > 0}
        <div class="holiday-list">
          <h5 class="list-title">
            {lang === 'th' ? 'วันที่เลือก' : 'Selected Dates'} ({holidays.length})
          </h5>
          <div class="holiday-tags">
            {#each holidays as date}
              <div class="holiday-tag">
                <span>{formatDate(date)}</span>
                <button on:click={() => removeHoliday(date)} type="button">
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

<style>
  .holiday-selector {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text);
    margin: 0;
  }
  
  .options {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    border: 2px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .option:hover {
    border-color: var(--primary);
    background: var(--bg-alt);
  }
  
  .option.selected {
    border-color: var(--primary);
    background: #f0fdfa;
  }
  
  .option-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    color: var(--text-muted);
  }
  
  .option.selected .option-icon {
    color: var(--primary);
  }
  
  .option span {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text);
  }
  
  .date-selection {
    padding: 1.25rem;
    background: var(--bg-alt);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .input-group {
    display: flex;
    gap: 0.75rem;
  }
  
  .date-input {
    flex: 1;
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 0.875rem;
    background: white;
  }
  
  .date-input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1);
  }
  
  .btn-add {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
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
    width: 18px;
    height: 18px;
  }
  
  .holiday-list {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .list-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text);
    margin: 0;
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
    padding: 0.5rem 0.75rem;
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
  
  .holiday-tag button:hover {
    opacity: 0.7;
  }
  
  .holiday-tag button svg {
    width: 14px;
    height: 14px;
  }
</style>