=== events/./_components/EventFilters.svelte ===
<script lang="ts">
  import { appState } from '../../_lib/stores/appState';
  import { getUniqueMonths } from '../../_lib/utils/filters';
  
  export let selectedMonth: string;
  export let selectedYear: string;
  export let availableYears: string[];
  export let sortBy: 'date' | 'title' | 'participants';
  export let sortOrder: 'asc' | 'desc';
  export let onSortChange: (sortBy: 'date' | 'title' | 'participants', sortOrder: 'asc' | 'desc') => void;
  
  $: lang = $appState.currentLang;
  $: months = getUniqueMonths();
  
  let showFilters = false;
  let showSortMenu = false;
  
  const sortOptions = [
    { value: 'date', label: { th: 'วันที่', en: 'Date' } },
    { value: 'title', label: { th: 'ชื่อ', en: 'Title' } },
    { value: 'participants', label: { th: 'ผู้เข้าร่วม', en: 'Participants' } }
  ];
  
  $: activeFiltersCount = (selectedMonth !== 'All' ? 1 : 0) + (selectedYear !== 'All' ? 1 : 0);
  
  function handleSort(newSortBy: 'date' | 'title' | 'participants') {
    if (sortBy === newSortBy) {
      onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      onSortChange(newSortBy, 'desc');
    }
    showSortMenu = false;
  }
  
  function resetFilters() {
    selectedMonth = 'All';
    selectedYear = 'All';
  }
</script>

<div class="event-filters">
  <!-- Filter Button -->
  <div class="filter-dropdown">
    <button class="filter-btn" on:click={() => showFilters = !showFilters}>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
      </svg>
      {lang === 'th' ? 'กรอง' : 'Filter'}
      {#if activeFiltersCount > 0}
        <span class="badge">{activeFiltersCount}</span>
      {/if}
    </button>
    
    {#if showFilters}
      <div class="dropdown-menu">
        <div class="dropdown-section">
          <label class="label">{lang === 'th' ? 'เดือน' : 'Month'}</label>
          <select class="select" bind:value={selectedMonth}>
            <option value="All">{lang === 'th' ? 'ทุกเดือน' : 'All Months'}</option>
            {#each months as month}
              <option value={month.value}>{month.label}</option>
            {/each}
          </select>
        </div>
        
        <div class="dropdown-section">
          <label class="label">{lang === 'th' ? 'ปี' : 'Year'}</label>
          <select class="select" bind:value={selectedYear}>
            <option value="All">{lang === 'th' ? 'ทุกปี' : 'All Years'}</option>
            {#each availableYears as year}
              <option value={year}>{year}</option>
            {/each}
          </select>
        </div>
        
        {#if activeFiltersCount > 0}
          <button class="btn-reset" on:click={resetFilters}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {lang === 'th' ? 'รีเซ็ตฟิลเตอร์' : 'Reset Filters'}
          </button>
        {/if}
      </div>
    {/if}
  </div>
  
  <!-- Sort Button -->
  <div class="sort-dropdown">
    <button class="sort-btn" on:click={() => showSortMenu = !showSortMenu}>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
      </svg>
      {lang === 'th' ? 'เรียง' : 'Sort'}
    </button>
    
    {#if showSortMenu}
      <div class="dropdown-menu">
        {#each sortOptions as option}
          <button 
            class="menu-item" 
            class:active={sortBy === option.value}
            on:click={() => handleSort(option.value)}
          >
            <span>{option.label[lang]}</span>
            {#if sortBy === option.value}
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {#if sortOrder === 'asc'}
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                {:else}
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                {/if}
              </svg>
            {/if}
          </button>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .event-filters {
    display: flex;
    gap: 0.75rem;
  }
  
  .filter-dropdown,
  .sort-dropdown {
    position: relative;
  }
  
  .filter-btn,
  .sort-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: white;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text);
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }
  
  .filter-btn:hover,
  .sort-btn:hover {
    background: var(--bg-alt);
    border-color: var(--primary);
  }
  
  .filter-btn svg,
  .sort-btn svg {
    width: 18px;
    height: 18px;
  }
  
  .badge {
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 0.375rem;
    background: var(--primary);
    color: white;
    border-radius: 9px;
    font-size: 0.75rem;
    font-weight: 600;
  }
  
  .dropdown-menu {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    min-width: 220px;
    padding: 0.75rem;
    background: white;
    border: 1px solid var(--border);
    border-radius: 8px;
    box-shadow: var(--shadow-md);
    z-index: 10;
  }
  
  .dropdown-section {
    margin-bottom: 0.75rem;
  }
  
  .dropdown-section:last-child {
    margin-bottom: 0;
  }
  
  .label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted);
    margin-bottom: 0.375rem;
  }
  
  .select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 0.875rem;
    background: white;
    cursor: pointer;
  }
  
  .select:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1);
  }
  
  .btn-reset {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.625rem;
    background: var(--bg-alt);
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text);
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 0.75rem;
  }
  
  .btn-reset:hover {
    background: var(--bg-hover);
    border-color: var(--primary);
    color: var(--primary);
  }
  
  .btn-reset svg {
    width: 16px;
    height: 16px;
  }
  
  .menu-item {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    border-radius: 6px;
    text-align: left;
    font-size: 0.875rem;
    color: var(--text);
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .menu-item:hover {
    background: var(--bg-alt);
  }
  
  .menu-item.active {
    color: var(--primary);
    font-weight: 600;
    background: #f0fdfa;
  }
  
  .menu-item svg {
    width: 16px;
    height: 16px;
  }
  
  @media (max-width: 640px) {
    .event-filters {
      width: 100%;
    }
    
    .filter-btn,
    .sort-btn {
      flex: 1;
      justify-content: center;
    }
    
    .dropdown-menu {
      left: 0;
      right: 0;
    }
  }
</style>