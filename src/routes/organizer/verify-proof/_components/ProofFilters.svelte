<script lang="ts">
  import { onMount } from 'svelte';
  import { appState } from '../../_lib/stores/appState';
  import api from '../../_lib/api/client';
  import { endpoints } from '../../_lib/api/endpoints';
  
  export let statusFilter: string;
  export let eventFilter: string;
  export let dateFilter: string;
  
  $: lang = $appState.currentLang;
  
  let events: any[] = [];
  
  const statuses = [
    { value: 'all', label: { th: 'ทั้งหมด', en: 'All' } },
    { value: 'pending', label: { th: 'รอตรวจ', en: 'Pending' } },
    { value: 'approved', label: { th: 'อนุมัติ', en: 'Approved' } },
    { value: 'rejected', label: { th: 'ปฏิเสธ', en: 'Rejected' } }
  ];
  
  onMount(async () => {
    try {
      const response = await api.get(endpoints.events.list);
      events = response.data;
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  });
</script>

<div class="proof-filters">
  <div class="filter-group">
    <label for="status-filter">{lang === 'th' ? 'สถานะ' : 'Status'}</label>
    <select id="status-filter" class="filter-select" bind:value={statusFilter}>
      {#each statuses as status}
        <option value={status.value}>{status.label[lang]}</option>
      {/each}
    </select>
  </div>
  
  <div class="filter-group">
    <label for="event-filter">{lang === 'th' ? 'กิจกรรม' : 'Event'}</label>
    <select id="event-filter" class="filter-select" bind:value={eventFilter}>
      <option value="all">{lang === 'th' ? 'ทั้งหมด' : 'All Events'}</option>
      {#each events as event}
        <option value={event.id}>{event.title}</option>
      {/each}
    </select>
  </div>
  
  <div class="filter-group">
    <label for="date-filter">{lang === 'th' ? 'วันที่' : 'Date'}</label>
    <input id="date-filter" type="date" class="filter-input" bind:value={dateFilter} />
  </div>
  
  {#if statusFilter !== 'pending' || eventFilter !== 'all' || dateFilter}
    <button class="btn-reset" on:click={() => { statusFilter = 'pending'; eventFilter = 'all'; dateFilter = ''; }}>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      {lang === 'th' ? 'รีเซ็ต' : 'Reset'}
    </button>
  {/if}
</div>

<style>
  .proof-filters { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; align-items: flex-end; }
  .filter-group { display: flex; flex-direction: column; gap: 0.5rem; flex: 1; min-width: 200px; }
  .filter-group label { font-size: 0.875rem; font-weight: 600; color: var(--text); }
  .filter-select, .filter-input { padding: 0.75rem; border: 1px solid var(--border); border-radius: 8px; font-size: 0.875rem; background: white; }
  .filter-select:focus, .filter-input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1); }
  .btn-reset { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; background: var(--bg-alt); border: 1px solid var(--border); border-radius: 8px; font-size: 0.875rem; font-weight: 500; cursor: pointer; white-space: nowrap; }
  .btn-reset:hover { background: var(--bg-hover); border-color: var(--primary); }
  .btn-reset svg { width: 16px; height: 16px; }
</style>