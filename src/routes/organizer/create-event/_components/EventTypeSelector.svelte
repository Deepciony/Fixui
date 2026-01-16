=== ./_components/EventTypeSelector.svelte ===
<script lang="ts">
  import { appState } from '../../_lib/stores/appState';
  
  export let eventType: 'single_day' | 'multi_day';
  export let maxCheckinsPerUser: number = 1;
  
  $: lang = $appState.currentLang;
</script>

<div class="event-type-selector">
  <h4 class="title">
    {lang === 'th' ? 'ประเภทกิจกรรม' : 'Event Type'}
  </h4>
  
  <div class="options">
    <label class="option" class:selected={eventType === 'single_day'}>
      <input
        type="radio"
        bind:group={eventType}
        value="single_day"
        hidden
      />
      <div class="option-icon">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <div class="option-content">
        <span class="option-title">
          {lang === 'th' ? 'วันเดียว' : 'Single Day'}
        </span>
        <span class="option-desc">
          {lang === 'th' ? 'เช็คอินได้ 1 ครั้ง' : 'Check-in once'}
        </span>
      </div>
      <div class="check-mark">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    </label>
    
    <label class="option" class:selected={eventType === 'multi_day'}>
      <input
        type="radio"
        bind:group={eventType}
        value="multi_day"
        hidden
      />
      <div class="option-icon">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      </div>
      <div class="option-content">
        <span class="option-title">
          {lang === 'th' ? 'หลายวัน' : 'Multi Day'}
        </span>
        <span class="option-desc">
          {lang === 'th' ? 'เช็คอินได้หลายครั้ง' : 'Multiple check-ins'}
        </span>
      </div>
      <div class="check-mark">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    </label>
  </div>
  
  {#if eventType === 'multi_day'}
    <div class="max-checkins">
      <label for="max-checkins" class="label">
        {lang === 'th' ? 'จำนวนเช็คอินสูงสุดต่อคน' : 'Max Check-ins Per User'}
      </label>
      <input
        id="max-checkins"
        type="number"
        min="1"
        bind:value={maxCheckinsPerUser}
        class="input"
      />
    </div>
  {/if}
</div>

<style>
  .event-type-selector {
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
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }
  
  .option {
    position: relative;
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem;
    border: 2px solid var(--border);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
    background: white;
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
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bg-alt);
    border-radius: 8px;
  }
  
  .option.selected .option-icon {
    background: var(--primary);
    color: white;
  }
  
  .option-icon svg {
    width: 24px;
    height: 24px;
  }
  
  .option-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .option-title {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text);
  }
  
  .option-desc {
    font-size: 0.75rem;
    color: var(--text-muted);
  }
  
  .check-mark {
    flex-shrink: 0;
    width: 24px;
    height: 24px;
    opacity: 0;
    transition: opacity 0.2s;
  }
  
  .option.selected .check-mark {
    opacity: 1;
    color: var(--primary);
  }
  
  .check-mark svg {
    width: 100%;
    height: 100%;
  }
  
  .max-checkins {
    padding: 1rem;
    background: var(--bg-alt);
    border-radius: 8px;
  }
  
  .label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 0.5rem;
  }
  
  .input {
    width: 100%;
    max-width: 200px;
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 0.875rem;
  }
  
  .input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1);
  }
</style>