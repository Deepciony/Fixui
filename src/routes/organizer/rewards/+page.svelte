=== rewards/./+page.svelte ===
<script lang="ts">
  import { onMount } from 'svelte';
  import { rewards } from '../_lib/stores/rewards';
  import { appState } from '../_lib/stores/appState';
  import api from '../_lib/api/client';
  import { endpoints } from '../_lib/api/endpoints';
  import { t } from '../_lib/i18n';
  import LoadingSpinner from '../_lib/components/LoadingSpinner.svelte';
  import ErrorMessage from '../_lib/components/ErrorMessage.svelte';
  import SuccessAlert from '../_lib/components/SuccessAlert.svelte';
  import LeaderboardTable from './_components/LeaderboardTable.svelte';
  import TierFilter from './_components/TierFilter.svelte';
  import UserStatsCard from './_components/UserStatsCard.svelte';
  import FinalizeButton from './_components/FinalizeButton.svelte';
  import MessageModal from './_components/MessageModal.svelte';
  
  $: lang = $appState.currentLang;
  
  let isLoading = true;
  let errorMessage = '';
  let successMessage = '';
  let selectedTier = 'all';
  let selectedEvent: number | null = null;
  let events: any[] = [];
  let showMessageModal = false;
  let selectedUsers: Set<number> = new Set();
  
  $: filteredLeaderboard = filterLeaderboard($rewards.leaderboard, selectedTier);
  $: canFinalize = selectedEvent && $rewards.rewardConfig && !$rewards.isFinalized;
  
  function filterLeaderboard(leaderboard: any[], tier: string) {
    if (tier === 'all') return leaderboard;
    return leaderboard.filter(entry => entry.tier === tier);
  }
  
  async function loadEvents() {
    try {
      const response = await api.get(endpoints.events.list);
      events = response.data.filter((e: any) => e.status === 'active');
    } catch (error) {
      console.error('Failed to load events:', error);
    }
  }
  
  async function loadRewards() {
    if (!selectedEvent) return;
    
    isLoading = true;
    errorMessage = '';
    
    try {
      const response = await api.get(endpoints.rewards.leaderboard(selectedEvent));
      rewards.setLeaderboard(response.data.leaderboard);
      rewards.setRewardConfig(response.data.config);
      rewards.setFinalized(response.data.isFinalized);
    } catch (error: any) {
      errorMessage = error.response?.data?.message || (lang === 'th' ? 'โหลดข้อมูลล้มเหลว' : 'Failed to load rewards');
      console.error('Error loading rewards:', error);
    } finally {
      isLoading = false;
    }
  }
  
  async function handleFinalize() {
    if (!selectedEvent) return;
    
    try {
      await api.post(endpoints.rewards.finalize(selectedEvent));
      successMessage = lang === 'th' ? 'ยืนยันรางวัลสำเร็จ' : 'Rewards finalized successfully';
      await loadRewards();
    } catch (error: any) {
      errorMessage = error.response?.data?.message || (lang === 'th' ? 'ยืนยันรางวัลล้มเหลว' : 'Failed to finalize rewards');
      console.error('Error finalizing rewards:', error);
    }
  }
  
  function handleSendMessage() {
    if (selectedUsers.size === 0) {
      errorMessage = lang === 'th' ? 'กรุณาเลือกผู้ใช้อย่างน้อย 1 คน' : 'Please select at least one user';
      return;
    }
    showMessageModal = true;
  }
  
  async function handleMessageSent(message: string) {
    try {
      await api.post(endpoints.rewards.sendMessage, {
        userIds: Array.from(selectedUsers),
        message
      });
      successMessage = lang === 'th' ? 'ส่งข้อความสำเร็จ' : 'Message sent successfully';
      selectedUsers.clear();
      selectedUsers = selectedUsers; // Trigger reactivity
    } catch (error: any) {
      errorMessage = error.response?.data?.message || (lang === 'th' ? 'ส่งข้อความล้มเหลว' : 'Failed to send message');
    }
  }
  
  function toggleUserSelection(userId: number) {
    if (selectedUsers.has(userId)) {
      selectedUsers.delete(userId);
    } else {
      selectedUsers.add(userId);
    }
    selectedUsers = selectedUsers; // Trigger reactivity
  }
  
  function selectAll() {
    filteredLeaderboard.forEach(entry => selectedUsers.add(entry.userId));
    selectedUsers = selectedUsers;
  }
  
  function deselectAll() {
    selectedUsers.clear();
    selectedUsers = selectedUsers;
  }
  
  onMount(() => {
    loadEvents();
  });
  
  $: if (selectedEvent) {
    loadRewards();
  }
</script>

<div class="rewards-page">
  <div class="page-header">
    <div class="header-left">
      <h1 class="page-title">{t('rewards')}</h1>
      <p class="page-subtitle">
        {lang === 'th' ? 'จัดการรางวัลและ Leaderboard' : 'Manage rewards and leaderboard'}
      </p>
    </div>
    
    <div class="header-actions">
      {#if selectedUsers.size > 0}
        <button class="btn-message" on:click={handleSendMessage}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          {lang === 'th' ? 'ส่งข้อความ' : 'Send Message'} ({selectedUsers.size})
        </button>
      {/if}
      
      <FinalizeButton
        disabled={!canFinalize}
        isFinalized={$rewards.isFinalized}
        onFinalize={handleFinalize}
      />
    </div>
  </div>
  
  <div class="controls-section">
    <div class="event-selector">
      <label for="event-select">{lang === 'th' ? 'เลือกกิจกรรม' : 'Select Event'}</label>
      <select id="event-select" class="select" bind:value={selectedEvent}>
        <option value={null}>{lang === 'th' ? 'เลือกกิจกรรม...' : 'Select event...'}</option>
        {#each events as event}
          <option value={event.id}>{event.title}</option>
        {/each}
      </select>
    </div>
    
    {#if selectedEvent}
      <TierFilter
        bind:selectedTier
        tiers={$rewards.rewardConfig?.tiers || []}
      />
    {/if}
  </div>
  
  {#if successMessage}
    <SuccessAlert message={successMessage} autoDismiss={true} />
  {/if}
  
  {#if errorMessage}
    <ErrorMessage message={errorMessage} onDismiss={() => errorMessage = ''} />
  {/if}
  
  {#if !selectedEvent}
    <div class="empty-state">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
      </svg>
      <h3>{lang === 'th' ? 'เลือกกิจกรรม' : 'Select an Event'}</h3>
      <p>{lang === 'th' ? 'เลือกกิจกรรมเพื่อดู Leaderboard และจัดการรางวัล' : 'Select an event to view leaderboard and manage rewards'}</p>
    </div>
  {:else if isLoading}
    <LoadingSpinner size="lg" />
  {:else if filteredLeaderboard.length === 0}
    <div class="empty-state">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
      <h3>{lang === 'th' ? 'ไม่มีข้อมูล' : 'No Data'}</h3>
      <p>{lang === 'th' ? 'ยังไม่มีผู้เข้าร่วมในกิจกรรมนี้' : 'No participants in this event yet'}</p>
    </div>
  {:else}
    <div class="stats-section">
      <UserStatsCard
        totalParticipants={$rewards.leaderboard.length}
        qualifiedUsers={filteredLeaderboard.length}
        isFinalized={$rewards.isFinalized}
      />
    </div>
    
    <div class="selection-bar">
      <span class="selection-info">
        {#if selectedUsers.size > 0}
          {lang === 'th' ? 'เลือกแล้ว' : 'Selected'}: <strong>{selectedUsers.size}</strong>
        {:else}
          {lang === 'th' ? 'เลือกผู้ใช้เพื่อส่งข้อความ' : 'Select users to send messages'}
        {/if}
      </span>
      
      <div class="selection-actions">
        <button class="btn-select" on:click={selectAll}>
          {lang === 'th' ? 'เลือกทั้งหมด' : 'Select All'}
        </button>
        {#if selectedUsers.size > 0}
          <button class="btn-select" on:click={deselectAll}>
            {lang === 'th' ? 'ยกเลิกทั้งหมด' : 'Deselect All'}
          </button>
        {/if}
      </div>
    </div>
    
    <LeaderboardTable
      leaderboard={filteredLeaderboard}
      selectedUsers={selectedUsers}
      onToggleUser={toggleUserSelection}
    />
  {/if}
</div>

<MessageModal
  show={showMessageModal}
  recipientCount={selectedUsers.size}
  onSend={handleMessageSent}
  onClose={() => showMessageModal = false}
/>

<style>
  .rewards-page { max-width: 1400px; margin: 0 auto; padding: 2rem; }
  .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; gap: 1.5rem; }
  .header-left { flex: 1; }
  .header-actions { display: flex; gap: 0.75rem; }
  .page-title { font-size: 2rem; font-weight: 700; color: var(--text); margin: 0; }
  .page-subtitle { font-size: 0.875rem; color: var(--text-muted); margin: 0.5rem 0 0; }
  
  .btn-message { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1rem; background: var(--primary); color: white; border: none; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
  .btn-message:hover { background: var(--primary-dark); transform: translateY(-1px); box-shadow: var(--shadow-md); }
  .btn-message svg { width: 18px; height: 18px; }
  
  .controls-section { display: flex; gap: 1rem; margin-bottom: 1.5rem; align-items: flex-end; }
  .event-selector { flex: 1; }
  .event-selector label { display: block; font-size: 0.875rem; font-weight: 600; color: var(--text); margin-bottom: 0.5rem; }
  .select { width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 8px; font-size: 0.875rem; background: white; }
  .select:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1); }
  
  .stats-section { margin-bottom: 1.5rem; }
  
  .selection-bar { display: flex; align-items: center; justify-content: space-between; padding: 1rem; background: var(--bg-alt); border-radius: 8px; margin-bottom: 1rem; }
  .selection-info { font-size: 0.875rem; color: var(--text-muted); }
  .selection-info strong { color: var(--text); font-weight: 600; }
  .selection-actions { display: flex; gap: 0.5rem; }
  .btn-select { padding: 0.5rem 1rem; background: white; border: 1px solid var(--border); border-radius: 6px; font-size: 0.875rem; cursor: pointer; transition: all 0.2s; }
  .btn-select:hover { background: var(--bg-hover); border-color: var(--primary); }
  
  .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; text-align: center; }
  .empty-state svg { width: 80px; height: 80px; color: var(--text-light); opacity: 0.5; margin-bottom: 1.5rem; }
  .empty-state h3 { font-size: 1.25rem; font-weight: 600; color: var(--text); margin: 0 0 0.5rem; }
  .empty-state p { font-size: 0.875rem; color: var(--text-muted); margin: 0; }
  
  @media (max-width: 768px) {
    .rewards-page { padding: 1rem; }
    .page-header { flex-direction: column; align-items: stretch; }
    .header-actions { flex-direction: column; }
    .controls-section { flex-direction: column; }
    .selection-bar { flex-direction: column; gap: 1rem; align-items: stretch; }
    .selection-actions { justify-content: stretch; }
    .btn-select { flex: 1; }
  }
</style>





