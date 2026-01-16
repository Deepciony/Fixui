=== verify-code/./_components/ParticipantInfo.svelte ===
<script lang="ts">
  import { appState } from '../../_lib/stores/appState';
  import { formatDate } from '../../_lib/utils/dateTime';
  
  export let participant: any;
  export let mode: 'check-in' | 'check-out';
  
  $: lang = $appState.currentLang;
</script>

<div class="participant-info">
  <div class="info-header">
    <div class="success-icon">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <h3 class="info-title">
      {mode === 'check-in' 
        ? (lang === 'th' ? 'เช็คอินสำเร็จ!' : 'Check-in Successful!') 
        : (lang === 'th' ? 'เช็คเอาท์สำเร็จ!' : 'Check-out Successful!')}
    </h3>
  </div>
  
  <div class="user-card">
    <div class="user-avatar">
      {participant.name?.[0] || 'U'}
    </div>
    <div class="user-details">
      <div class="user-name">{participant.name}</div>
      <div class="user-email">{participant.email}</div>
    </div>
  </div>
  
  <div class="info-grid">
    <div class="info-item">
      <div class="item-label">{lang === 'th' ? 'กิจกรรม' : 'Event'}</div>
      <div class="item-value">{participant.eventName}</div>
    </div>
    
    <div class="info-item">
      <div class="item-label">{lang === 'th' ? 'เวลา' : 'Time'}</div>
      <div class="item-value">{formatDate(new Date(), 'long')}</div>
    </div>
    
    {#if participant.checkInCount}
      <div class="info-item">
        <div class="item-label">{lang === 'th' ? 'จำนวนครั้ง' : 'Check-ins'}</div>
        <div class="item-value">{participant.checkInCount}</div>
      </div>
    {/if}
    
    {#if participant.points}
      <div class="info-item">
        <div class="item-label">{lang === 'th' ? 'คะแนน' : 'Points'}</div>
        <div class="item-value highlight">+{participant.points}</div>
      </div>
    {/if}
  </div>
  
  {#if participant.message}
    <div class="message-box">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <p>{participant.message}</p>
    </div>
  {/if}
</div>

<style>
  .participant-info { background: linear-gradient(135deg, #f0fdfa 0%, #ccfbf1 100%); border: 2px solid #14b8a6; border-radius: 12px; padding: 2rem; margin-top: 2rem; }
  
  .info-header { text-align: center; margin-bottom: 1.5rem; }
  .success-icon { width: 64px; height: 64px; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; background: var(--success); border-radius: 50%; }
  .success-icon svg { width: 36px; height: 36px; color: white; }
  .info-title { font-size: 1.5rem; font-weight: 700; color: var(--text); margin: 0; }
  
  .user-card { display: flex; align-items: center; gap: 1rem; padding: 1.25rem; background: white; border-radius: 12px; margin-bottom: 1.5rem; }
  .user-avatar { width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; background: var(--primary); color: white; border-radius: 50%; font-size: 1.5rem; font-weight: 600; flex-shrink: 0; }
  .user-details { flex: 1; min-width: 0; }
  .user-name { font-size: 1.125rem; font-weight: 600; color: var(--text); margin-bottom: 0.25rem; }
  .user-email { font-size: 0.875rem; color: var(--text-muted); }
  
  .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1rem; }
  .info-item { background: white; border-radius: 8px; padding: 1rem; }
  .item-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem; }
  .item-value { font-size: 1.125rem; font-weight: 600; color: var(--text); }
  .item-value.highlight { color: var(--success); }
  
  .message-box { display: flex; align-items: start; gap: 0.75rem; padding: 1rem; background: white; border-radius: 8px; border-left: 3px solid var(--primary); }
  .message-box svg { width: 20px; height: 20px; color: var(--primary); flex-shrink: 0; margin-top: 0.125rem; }
  .message-box p { margin: 0; font-size: 0.875rem; color: var(--text); line-height: 1.6; }
  
  @media (max-width: 640px) {
    .info-grid { grid-template-columns: 1fr; }
  }
</style>