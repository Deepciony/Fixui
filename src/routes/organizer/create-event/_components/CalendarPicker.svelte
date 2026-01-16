=== ./_components/CalendarPicker.svelte ===
<script lang="ts">
  import { appState } from '../../_lib/stores/appState';
  
  export let selectedDates: Date[] = [];
  export let minDate: Date | null = null;
  export let maxDate: Date | null = null;
  
  $: lang = $appState.currentLang;
  
  let currentMonth = new Date().getMonth();
  let currentYear = new Date().getFullYear();
  
  $: monthName = new Date(currentYear, currentMonth).toLocaleDateString(
    lang === 'th' ? 'th-TH' : 'en-US',
    { month: 'long', year: 'numeric' }
  );
  
  $: days = generateCalendarDays(currentYear, currentMonth);
  
  function generateCalendarDays(year: number, month: number) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  }
  
  function isDateSelected(date: Date | null): boolean {
    if (!date) return false;
    return selectedDates.some(d => 
      d.getDate() === date.getDate() &&
      d.getMonth() === date.getMonth() &&
      d.getFullYear() === date.getFullYear()
    );
  }
  
  function toggleDate(date: Date | null) {
    if (!date) return;
    
    if (isDateSelected(date)) {
      selectedDates = selectedDates.filter(d => 
        !(d.getDate() === date.getDate() &&
          d.getMonth() === date.getMonth() &&
          d.getFullYear() === date.getFullYear())
      );
    } else {
      selectedDates = [...selectedDates, date];
    }
  }
  
  function previousMonth() {
    if (currentMonth === 0) {
      currentMonth = 11;
      currentYear--;
    } else {
      currentMonth--;
    }
  }
  
  function nextMonth() {
    if (currentMonth === 11) {
      currentMonth = 0;
      currentYear++;
    } else {
      currentMonth++;
    }
  }
</script>

<div class="calendar-picker">
  <div class="calendar-header">
    <button class="nav-btn" on:click={previousMonth} type="button">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
    </button>
    <span class="month-label">{monthName}</span>
    <button class="nav-btn" on:click={nextMonth} type="button">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </div>
  
  <div class="calendar-grid">
    {#each ['S', 'M', 'T', 'W', 'T', 'F', 'S'] as day}
      <div class="day-label">{day}</div>
    {/each}
    
    {#each days as day}
      <button
        class="day-cell"
        class:selected={isDateSelected(day)}
        class:empty={!day}
        disabled={!day}
        on:click={() => toggleDate(day)}
        type="button"
      >
        {day ? day.getDate() : ''}
      </button>
    {/each}
  </div>
</div>

<style>
  .calendar-picker {
    background: white;
    border: 1px solid var(--border);
    border-radius: 8px;
    padding: 1rem;
  }
  
  .calendar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 1rem;
  }
  
  .nav-btn {
    width: 32px;
    height: 32px;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .nav-btn:hover {
    background: var(--bg-alt);
  }
  
  .nav-btn svg {
    width: 20px;
    height: 20px;
    color: var(--text);
  }
  
  .month-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text);
  }
  
  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.25rem;
  }
  
  .day-label {
    text-align: center;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted);
    padding: 0.5rem;
  }
  
  .day-cell {
    aspect-ratio: 1;
    padding: 0.5rem;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 6px;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .day-cell:not(.empty):hover {
    background: var(--bg-alt);
    border-color: var(--primary);
  }
  
  .day-cell.selected {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
  }
  
  .day-cell.empty {
    cursor: default;
    opacity: 0;
  }
</style>