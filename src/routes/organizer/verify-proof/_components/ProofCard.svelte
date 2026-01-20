<script lang="ts">
  import { appState } from '../../_lib/stores/appState';
  import { auth } from '../../_lib/stores/auth';
  import { formatDate } from '../../_lib/utils/dateTime';
  
  export let proof: any;
  export let onApprove: () => void;
  export let onReject: () => void;
  
  $: lang = $appState.currentLang;
  $: statusColor = proof.status === 'approved' ? 'var(--success)' : proof.status === 'rejected' ? 'var(--error)' : 'var(--warning)';
  $: statusBg = proof.status === 'approved' ? '#d1fae5' : proof.status === 'rejected' ? '#fee2e2' : '#fef3c7';
  
  let showFullImage = false;
  $: canModerate = $auth.isAuthenticated && ($auth.user?.role === 'organizer' || $auth.user?.role === 'admin');
</script>

<div class="proof-card">
  <div class="proof-image" on:click={() => showFullImage = true} on:keypress role="button" tabindex="0">
    <img src={proof.imageUrl} alt="Proof" />
    <div class="image-overlay">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
      </svg>
    </div>
    <div class="status-badge" style="background: {statusBg}; color: {statusColor}">
      {proof.status === 'approved' ? (lang === 'th' ? 'อนุมัติ' : 'Approved') : 
       proof.status === 'rejected' ? (lang === 'th' ? 'ปฏิเสธ' : 'Rejected') : 
       (lang === 'th' ? 'รอตรวจ' : 'Pending')}
    </div>
  </div>
  
  <div class="proof-content">
    <div class="user-info">
      <div class="user-avatar">{proof.userName?.[0] || 'U'}</div>
      <div class="user-details">
        <div class="user-name">{proof.userName}</div>
        <div class="user-email">{proof.userEmail}</div>
      </div>
    </div>
    
    <div class="proof-meta">
      <div class="meta-item">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>{proof.eventName}</span>
      </div>
      
      <div class="meta-item">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{formatDate(proof.submittedAt, 'short')}</span>
      </div>
    </div>
    
    {#if proof.description}
      <p class="proof-description">{proof.description}</p>
    {/if}
    
    {#if proof.status === 'pending'}
      {#if canModerate}
        <div class="proof-actions">
          <button class="btn-reject" on:click={onReject}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            {lang === 'th' ? 'ปฏิเสธ' : 'Reject'}
          </button>
          
          <button class="btn-approve" on:click={onApprove}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            {lang === 'th' ? 'อนุมัติ' : 'Approve'}
          </button>
        </div>
      {:else}
        <div class="muted-note">{lang === 'th' ? 'เฉพาะผู้จัดงานสามารถอนุมัติหรือปฏิเสธได้' : 'Only organizers can approve or reject'}</div>
      {/if}
    {:else if proof.status === 'approved' && proof.points}
      <div class="points-badge">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
        </svg>
        +{proof.points} {lang === 'th' ? 'คะแนน' : 'points'}
      </div>
    {:else if proof.status === 'rejected' && proof.rejectionReason}
      <div class="rejection-reason">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{proof.rejectionReason}</span>
      </div>
    {/if}
  </div>
</div>

{#if showFullImage}
  <div class="image-modal" on:click={() => showFullImage = false} on:keypress role="button" tabindex="0">
    <img src={proof.imageUrl} alt="Proof full" />
    <button 
      class="btn-close" 
      on:click={() => showFullImage = false}
      aria-label={lang === 'th' ? 'ปิด' : 'Close'}
    >
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  </div>
{/if}

<style>
  .proof-card { background: white; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; transition: all 0.2s; }
  .proof-card:hover { box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1); transform: translateY(-2px); }
  
  .proof-image { position: relative; width: 100%; aspect-ratio: 4/3; background: var(--bg-alt); cursor: pointer; overflow: hidden; }
  .proof-image img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; }
  .proof-image:hover img { transform: scale(1.05); }
  
  .image-overlay { position: absolute; inset: 0; background: rgba(0, 0, 0, 0.4); display: flex; align-items: center; justify-content: center; opacity: 0; transition: opacity 0.2s; }
  .proof-image:hover .image-overlay { opacity: 1; }
  .image-overlay svg { width: 48px; height: 48px; color: white; }
  
  .status-badge { position: absolute; top: 0.75rem; right: 0.75rem; padding: 0.375rem 0.75rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; backdrop-filter: blur(8px); }
  
  .proof-content { padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem; }
  
  .user-info { display: flex; align-items: center; gap: 0.75rem; }
  .user-avatar { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: var(--primary); color: white; border-radius: 50%; font-size: 1rem; font-weight: 600; }
  .user-details { flex: 1; min-width: 0; }
  .user-name { font-weight: 600; color: var(--text); }
  .user-email { font-size: 0.75rem; color: var(--text-muted); }
  
  .proof-meta { display: flex; flex-direction: column; gap: 0.5rem; }
  .meta-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--text-muted); }
  .meta-item svg { width: 16px; height: 16px; flex-shrink: 0; }
  
  .proof-description { font-size: 0.875rem; color: var(--text); margin: 0; line-height: 1.6; }
  
  .proof-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; }
  .btn-reject, .btn-approve { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.625rem; border-radius: 6px; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
  .btn-reject { background: #fee2e2; border: 1px solid #fecaca; color: #ef4444; }
  .btn-reject:hover { background: #fecaca; }
  .btn-approve { background: #d1fae5; border: 1px solid #a7f3d0; color: #10b981; }
  .btn-approve:hover { background: #a7f3d0; }
  .btn-reject svg, .btn-approve svg { width: 16px; height: 16px; }
  
  .points-badge { display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem; background: #d1fae5; border: 1px solid #10b981; border-radius: 8px; font-weight: 600; color: #10b981; }
  .points-badge svg { width: 20px; height: 20px; }
  
  .rejection-reason { display: flex; align-items: start; gap: 0.5rem; padding: 0.75rem; background: #fee2e2; border: 1px solid #ef4444; border-radius: 8px; font-size: 0.875rem; color: #ef4444; }
  .rejection-reason svg { width: 16px; height: 16px; flex-shrink: 0; margin-top: 0.125rem; }
  .muted-note { font-size: 0.875rem; color: var(--text-muted); padding: 0.5rem 0; }
  
  .image-modal { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.9); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 2rem; }
  .image-modal img { max-width: 100%; max-height: 100%; object-fit: contain; }
  .btn-close { position: absolute; top: 1rem; right: 1rem; width: 40px; height: 40px; padding: 0; background: rgba(255, 255, 255, 0.2); border: none; border-radius: 50%; color: white; cursor: pointer; }
  .btn-close svg { width: 24px; height: 24px; }
</style>