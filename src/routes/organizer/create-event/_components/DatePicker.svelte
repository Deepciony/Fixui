== ./_components/DatePicker.svelte ===
<script lang="ts">
  import { appState } from '../../_lib/stores/appState';
  
  export let label: string;
  export let date: { day: string; month: string; year: string };
  export let required: boolean = false;
  export let error: string = '';
  
  $: lang = $appState.currentLang;
  
  const currentYear = new Date().getFullYear();
</script>

<div class="date-picker">
  <fieldset class="date-fieldset">
    <legend class="label">
      {label}
      {#if required}
        <span class="required">*</span>
      {/if}
    </legend>

    <div class="date-inputs">
    <input
      type="number"
      placeholder={lang === 'th' ? 'วัน' : 'Day'}
      min="1"
      max="31"
      class="input"
      class:error={error}
      bind:value={date.day}
    />
    
    <input
      type="number"
      placeholder={lang === 'th' ? 'เดือน' : 'Month'}
      min="1"
      max="12"
      class="input"
      class:error={error}
      bind:value={date.month}
    />
    
    <input
      type="number"
      placeholder={lang === 'th' ? 'ปี' : 'Year'}
      min={currentYear}
      max={currentYear + 10}
      class="input input-year"
      class:error={error}
      bind:value={date.year}
    />
  </div>
  
    {#if error}
      <span class="error-message">{error}</span>
    {/if}
  </fieldset>
</div>

<style>
  .date-picker {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text);
  }
  
  .required {
    color: var(--error);
  }
  
  .date-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr 1.5fr;
    gap: 0.5rem;
  }
  
  .input {
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 0.875rem;
    text-align: center;
    transition: all 0.2s;
  }
  
  .input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1);
  }
  
  .input.error {
    border-color: var(--error);
  }
  
  .input::placeholder {
    color: var(--text-light);
  }
  
  .error-message {
    font-size: 0.75rem;
    color: var(--error);
  }
  
  @media (max-width: 640px) {
    .date-inputs {
      grid-template-columns: 1fr 1fr;
    }
    
    .input-year {
      grid-column: 1 / -1;
    }
  }
</style>