=== events/./+page.svelte ===
<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { eventList } from '../_lib/stores/eventList';
  import { appState } from '../_lib/stores/appState';
  import api from '../_lib/api/client';
  import { endpoints } from '../_lib/api/endpoints';
  import { filterEventsOptimized, sortEvents, getUniqueYears } from '../_lib/utils/filters';
  import { t } from '../_lib/i18n';
  import LoadingSpinner from '../_lib/components/LoadingSpinner.svelte';
  import ErrorMessage from '../_lib/components/ErrorMessage.svelte';
  import ConfirmDialog from '../_lib/components/ConfirmDialog.svelte';
  import EventCard from './_components/EventCard.svelte';
  import EventFilters from './_components/EventFilters.svelte';
  import SearchBar from './_components/SearchBar.svelte';
  
  $: lang = $appState.currentLang;
  
  let searchQuery = '';
  let selectedMonth = 'All';
  let selectedYear = 'All';
  let isLoading = true;
  let errorMessage = '';
  let showDeleteConfirm = false;
  let eventToDelete: number | null = null;
  
  $: filteredEvents = filterEventsOptimized($eventList.events, searchQuery, selectedMonth, selectedYear);
  $: sortedEvents = sortEvents(filteredEvents, $eventList.sortBy, $eventList.sortOrder);
  $: availableYears = getUniqueYears($eventList.events);
  
  async function loadEvents() {
    isLoading = true;
    errorMessage = '';
    
    try {
      const response = await api.get(endpoints.events.list);
      eventList.setEvents(response.data);
    } catch (error: any) {
      errorMessage = error.response?.data?.message || (lang === 'th' ? 'โหลดข้อมูลล้มเหลว' : 'Failed to load events');
      console.error('Error loading events:', error);
    } finally {
      isLoading = false;
    }
  }
  
  function handleCreateEvent() {
    goto('/organizer/create-event/general');
  }
  
  function handleEditEvent(eventId: number) {
    goto(`/organizer/create-event/general?id=${eventId}`);
  }
  
  function handleViewEvent(eventId: number) {
    goto(`/organizer/events/${eventId}`);
  }
  
  function confirmDelete(eventId: number) {
    eventToDelete = eventId;
    showDeleteConfirm = true;
  }
  
  async function handleDeleteEvent() {
    if (!eventToDelete) return;
    
    try {
      await api.delete(endpoints.events.delete(eventToDelete));
      await loadEvents();
      showDeleteConfirm = false;
      eventToDelete = null;
    } catch (error) {
      console.error('Error deleting event:', error);
      errorMessage = lang === 'th' ? 'ลบกิจกรรมล้มเหลว' : 'Failed to delete event';
      showDeleteConfirm = false;
    }
  }
  
  function handleSortChange(sortBy: 'date' | 'title' | 'participants', sortOrder: 'asc' | 'desc') {
    eventList.setSortPreferences(sortBy, sortOrder);
  }
  
  onMount(() => {
    loadEvents();
  });
</script>

<div class="events-page">
  <div class="page-header">
    <div class="header-left">
      <h1 class="page-title">{t('eventList')}</h1>
      <p class="page-subtitle">
        {lang === 'th' ? 'จัดการกิจกรรมทั้งหมด' : 'Manage all events'}
      </p>
    </div>
    
    <button class="btn-create" on:click={handleCreateEvent}>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
      {t('createEvent')}
    </button>
  </div>
  
  <div class="controls-section">
    <SearchBar 
      bind:searchQuery
      placeholder={lang === 'th' ? 'ค้นหาชื่อกิจกรรม, สถานที่...' : 'Search event name, location...'}
    />
    
    <EventFilters
      bind:selectedMonth
      bind:selectedYear
      {availableYears}
      sortBy={$eventList.sortBy}
      sortOrder={$eventList.sortOrder}
      onSortChange={handleSortChange}
    />
  </div>
  
  {#if errorMessage}
    <ErrorMessage message={errorMessage} onDismiss={() => errorMessage = ''} />
  {/if}
  
  {#if isLoading}
    <LoadingSpinner size="lg" />
  {:else if sortedEvents.length === 0}
    <div class="empty-state">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <h3>{lang === 'th' ? 'ไม่พบกิจกรรม' : 'No events found'}</h3>
      <p>{lang === 'th' ? 'ลองค้นหาด้วยคำอื่น หรือสร้างกิจกรรมใหม่' : 'Try different search terms or create a new event'}</p>
      <button class="btn-create-empty" on:click={handleCreateEvent}>
        {t('createEvent')}
      </button>
    </div>
  {:else}
    <div class="events-stats">
      <span class="stat-text">
        {lang === 'th' ? 'แสดง' : 'Showing'} 
        <strong>{sortedEvents.length}</strong> 
        {lang === 'th' ? 'จาก' : 'of'} 
        <strong>{$eventList.totalEvents}</strong> 
        {lang === 'th' ? 'กิจกรรม' : 'events'}
      </span>
    </div>
    
    <div class="events-grid">
      {#each sortedEvents as event (event.id)}
        <EventCard 
          {event}
          onEdit={() => handleEditEvent(event.id)}
          onDelete={() => confirmDelete(event.id)}
          onView={() => handleViewEvent(event.id)}
        />
      {/each}
    </div>
  {/if}
</div>

<ConfirmDialog
  show={showDeleteConfirm}
  title={lang === 'th' ? 'ยืนยันการลบ' : 'Confirm Delete'}
  message={lang === 'th' ? 'คุณแน่ใจหรือไม่ที่จะลบกิจกรรมนี้? การดำเนินการนี้ไม่สามารถย้อนกลับได้' : 'Are you sure you want to delete this event? This action cannot be undone.'}
  confirmText={lang === 'th' ? 'ลบ' : 'Delete'}
  cancelText={lang === 'th' ? 'ยกเลิก' : 'Cancel'}
  confirmColor="var(--error)"
  onConfirm={handleDeleteEvent}
  onCancel={() => {
    showDeleteConfirm = false;
    eventToDelete = null;
  }}
/>

<style>
  .events-page {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
    gap: 1.5rem;
  }
  
  .header-left {
    flex: 1;
  }
  
  .page-title {
    font-size: 2rem;
    font-weight: 700;
    color: var(--text);
    margin: 0;
  }
  
  .page-subtitle {
    font-size: 0.875rem;
    color: var(--text-muted);
    margin: 0.5rem 0 0;
  }
  
  .btn-create {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }
  
  .btn-create:hover {
    background: var(--primary-dark);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }
  
  .btn-create svg {
    width: 20px;
    height: 20px;
  }
  
  .controls-section {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }
  
  .events-stats {
    padding: 0.75rem 0;
    margin-bottom: 1rem;
  }
  
  .stat-text {
    font-size: 0.875rem;
    color: var(--text-muted);
  }
  
  .stat-text strong {
    color: var(--text);
    font-weight: 600;
  }
  
  .events-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    text-align: center;
  }
  
  .empty-state svg {
    width: 80px;
    height: 80px;
    color: var(--text-light);
    opacity: 0.5;
    margin-bottom: 1.5rem;
  }
  
  .empty-state h3 {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--text);
    margin: 0 0 0.5rem;
  }
  
  .empty-state p {
    font-size: 0.875rem;
    color: var(--text-muted);
    margin: 0 0 1.5rem;
    max-width: 400px;
  }
  
  .btn-create-empty {
    padding: 0.75rem 1.5rem;
    background: var(--primary);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-create-empty:hover {
    background: var(--primary-dark);
  }
  
  @media (max-width: 768px) {
    .events-page {
      padding: 1rem;
    }
    
    .page-header {
      flex-direction: column;
      align-items: stretch;
    }
    
    .btn-create {
      width: 100%;
      justify-content: center;
    }
    
    .controls-section {
      flex-direction: column;
    }
    
    .events-grid {
      grid-template-columns: 1fr;
    }
  }
</style>





