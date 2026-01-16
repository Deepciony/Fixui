<script lang="ts">
  import { appState } from '../../_lib/stores/appState';
  
  export let show: boolean;
  export let proof: any;
  export let onConfirm: (data: { points: number; message: string }) => void;
  export let onCancel: () => void;
  
  $: lang = $appState.currentLang;
  
  let points = 10;
  let message = '';
  
  function handleConfirm() {
    onConfirm({ points, message });
    points = 10;
    message = '';
  }
</script>

{#if show && proof}
  <div class="modal-overlay" on:click={onCancel} on:keypress role="button" tabindex="0">
    <div class="modal-content" on:click|stopPropagation on:keypress role="button" tabindex="0">
      <div class="modal-header">
        <h3>{lang === 'th' ? 'อนุมัติหลักฐาน' : 'Approve Proof'}</h3>
        <button 
          class="btn-close" 
          on:click={onCancel}
          aria-label={lang === 'th' ? 'ปิด' : 'Close'}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div class="modal-body">
        <div class="proof-preview">
          <img src={proof.imageUrl} alt="Proof" />
        </div>
        
        <div class="user-info">
          <strong>{proof.userName}</strong> • {proof.eventName}
        </div>
        
        <div class="form-group">
          <label for="points">{lang === 'th' ? 'คะแนนที่จะให้' : 'Points to Award'} <span class="required">*</span></label>
          <input type="number" id="points" class="input" min="1" bind:value={points} />
        </div>
        
        <div class="form-group">
          <label for="message">{lang === 'th' ? 'ข้อความถึงผู้ใช้ (ถ้ามี)' : 'Message to User (optional)'}</label>
          <textarea id="message" class="textarea" rows="3" bind:value={message} placeholder={lang === 'th' ? 'ข้อความแสดงความยินดี...' : 'Congratulations message...'}></textarea>
        </div>
      </div>
      
      <div class="modal-footer">
        <button class="btn-cancel" on:click={onCancel}>{lang === 'th' ? 'ยกเลิก' : 'Cancel'}</button>
        <button class="btn-confirm" on:click={handleConfirm}>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          {lang === 'th' ? 'อนุมัติ' : 'Approve'}
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .modal-overlay { position: fixed; inset: 0; background: rgba(0, 0, 0, 0.5); display: flex; align-items: center; justify-content: center; z-index: 100; }
  .modal-content { background: white; border-radius: 12px; max-width: 500px; width: 90%; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column; }
  .modal-header { display: flex; align-items: center; justify-content: space-between; padding: 1.5rem; border-bottom: 1px solid var(--border); }
  .modal-header h3 { margin: 0; font-size: 1.25rem; font-weight: 600; }
  .btn-close { width: 32px; height: 32px; padding: 0; background: transparent; border: none; border-radius: 6px; cursor: pointer; }
  .btn-close:hover { background: var(--bg-alt); }
  .btn-close svg { width: 20px; height: 20px; }
  .modal-body { padding: 1.5rem; overflow-y: auto; }
  .proof-preview { width: 100%; aspect-ratio: 4/3; border-radius: 8px; overflow: hidden; margin-bottom: 1rem; }
  .proof-preview img { width: 100%; height: 100%; object-fit: cover; }
  .user-info { padding: 0.75rem; background: var(--bg-alt); border-radius: 6px; margin-bottom: 1.5rem; font-size: 0.875rem; }
  .form-group { margin-bottom: 1rem; }
  .form-group label { display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 0.5rem; }
  .required { color: var(--error); }
  .input, .textarea { width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 8px; font-size: 0.875rem; font-family: inherit; }
  .input:focus, .textarea:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1); }
  .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1.5rem; border-top: 1px solid var(--border); }
  .btn-cancel, .btn-confirm { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
  .btn-cancel { background: white; border: 1px solid var(--border); }
  .btn-confirm { background: var(--success); color: white; border: none; }
  .btn-confirm svg { width: 16px; height: 16px; }
</style>