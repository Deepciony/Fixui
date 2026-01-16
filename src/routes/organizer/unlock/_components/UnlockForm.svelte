=== unlock/./_components/UnlockForm.svelte ===
<script lang="ts">
  import { appState } from '../../_lib/stores/appState';
  
  export let onUnlock: (data: { email: string; reason: string }) => void;
  export let isUnlocking: boolean;
  
  $: lang = $appState.currentLang;
  
  let email = '';
  let reason = '';
  let searchResults: any[] = [];
  let selectedUser: any = null;
  let isSearching = false;
  
  async function handleSearch() {
    if (!email || email.length < 3) return;
    
    isSearching = true;
    
    // Simulate API call
    setTimeout(() => {
      // Mock search results
      searchResults = email.includes('@') ? [
        {
          id: 1,
          name: 'John Doe',
          email: email,
          status: 'locked',
          lockReason: 'Suspicious activity detected',
          lockedAt: new Date().toISOString()
        }
      ] : [];
      isSearching = false;
    }, 500);
  }
  
  function selectUser(user: any) {
    selectedUser = user;
    email = user.email;
    searchResults = [];
  }
  
  function handleSubmit() {
    if (!email || !reason) return;
    onUnlock({ email, reason });
  }
  
  function reset() {
    email = '';
    reason = '';
    selectedUser = null;
    searchResults = [];
  }
</script>

<div class="unlock-form">
  <div class="form-header">
    <h2 class="form-title">{lang === 'th' ? 'ปลดล็อคบัญชี' : 'Unlock Account'}</h2>
    <p class="form-desc">{lang === 'th' ? 'ค้นหาและปลดล็อคบัญชีผู้ใช้' : 'Search and unlock user accounts'}</p>
  </div>
  
  <div class="form-body">
    <div class="form-group">
      <label for="email">
        {lang === 'th' ? 'อีเมลผู้ใช้' : 'User Email'}
        <span class="required">*</span>
      </label>
      <div class="search-input-wrapper">
        <input 
          type="email" 
          id="email" 
          class="input"
          placeholder={lang === 'th' ? 'กรอกอีเมลผู้ใช้...' : 'Enter user email...'}
          bind:value={email}
          on:input={handleSearch}
          disabled={isUnlocking}
        />
        {#if isSearching}
          <div class="search-spinner">
            <svg class="spinner" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="4" fill="none" />
            </svg>
          </div>
        {/if}
      </div>
      
      {#if searchResults.length > 0}
        <div class="search-results">
          {#each searchResults as user}
            <button class="result-item" on:click={() => selectUser(user)}>
              <div class="user-avatar">{user.name[0]}</div>
              <div class="user-info">
                <div class="user-name">{user.name}</div>
                <div class="user-email">{user.email}</div>
              </div>
              <div class="user-status locked">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {lang === 'th' ? 'ถูกล็อค' : 'Locked'}
              </div>
            </button>
          {/each}
        </div>
      {/if}
    </div>
    
    {#if selectedUser}
      <div class="user-details">
        <div class="detail-header">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{lang === 'th' ? 'ข้อมูลผู้ใช้' : 'User Information'}</span>
        </div>
        <div class="detail-body">
          <div class="detail-row">
            <span class="detail-label">{lang === 'th' ? 'ชื่อ:' : 'Name:'}</span>
            <span class="detail-value">{selectedUser.name}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">{lang === 'th' ? 'สถานะ:' : 'Status:'}</span>
            <span class="detail-value status-locked">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {lang === 'th' ? 'ถูกล็อค' : 'Locked'}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">{lang === 'th' ? 'เหตุผล:' : 'Reason:'}</span>
            <span class="detail-value">{selectedUser.lockReason}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">{lang === 'th' ? 'ล็อคเมื่อ:' : 'Locked At:'}</span>
            <span class="detail-value">{new Date(selectedUser.lockedAt).toLocaleString()}</span>
          </div>
        </div>
      </div>
    {/if}
    
    <div class="form-group">
      <label for="reason">
        {lang === 'th' ? 'เหตุผลในการปลดล็อค' : 'Unlock Reason'}
        <span class="required">*</span>
      </label>
      <textarea 
        id="reason" 
        class="textarea"
        rows="4"
        placeholder={lang === 'th' ? 'ระบุเหตุผลในการปลดล็อคบัญชี...' : 'Specify reason for unlocking account...'}
        bind:value={reason}
        disabled={isUnlocking}
      ></textarea>
      <p class="hint">{lang === 'th' ? 'เหตุผลจะถูกส่งไปยังผู้ใช้ทางอีเมล' : 'Reason will be sent to user via email'}</p>
    </div>
  </div>
  
  <div class="form-footer">
    <button class="btn-reset" on:click={reset} disabled={isUnlocking}>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
      {lang === 'th' ? 'รีเซ็ต' : 'Reset'}
    </button>
    
    <button 
      class="btn-unlock" 
      on:click={handleSubmit}
      disabled={!email || !reason || isUnlocking}
    >
      {#if isUnlocking}
        <svg class="spinner" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="4" fill="none" />
        </svg>
        {lang === 'th' ? 'กำลังปลดล็อค...' : 'Unlocking...'}
      {:else}
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
        </svg>
        {lang === 'th' ? 'ปลดล็อคบัญชี' : 'Unlock Account'}
      {/if}
    </button>
  </div>
</div>

<style>
  .unlock-form { background: white; border: 1px solid var(--border); border-radius: 12px; }
  
  .form-header { padding: 1.5rem; border-bottom: 1px solid var(--border); }
  .form-title { font-size: 1.25rem; font-weight: 600; color: var(--text); margin: 0 0 0.25rem; }
  .form-desc { font-size: 0.875rem; color: var(--text-muted); margin: 0; }
  
  .form-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
  
  .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
  .form-group label { font-size: 0.875rem; font-weight: 600; color: var(--text); }
  .required { color: var(--error); }
  
  .search-input-wrapper { position: relative; }
  .input, .textarea { width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 8px; font-size: 0.875rem; font-family: inherit; }
  .input:focus, .textarea:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1); }
  .input:disabled, .textarea:disabled { background: var(--bg-alt); opacity: 0.6; cursor: not-allowed; }
  
  .search-spinner { position: absolute; right: 0.75rem; top: 50%; transform: translateY(-50%); }
  
  .search-results { position: absolute; top: calc(100% + 0.5rem); left: 0; right: 0; background: white; border: 1px solid var(--border); border-radius: 8px; box-shadow: var(--shadow-md); max-height: 300px; overflow-y: auto; z-index: 10; }
  .result-item { width: 100%; display: flex; align-items: center; gap: 1rem; padding: 1rem; background: transparent; border: none; border-bottom: 1px solid var(--border); cursor: pointer; transition: background 0.2s; text-align: left; }
  .result-item:hover { background: var(--bg-alt); }
  .result-item:last-child { border-bottom: none; }
  
  .user-avatar { width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: var(--primary); color: white; border-radius: 50%; font-size: 1rem; font-weight: 600; flex-shrink: 0; }
  .user-info { flex: 1; min-width: 0; }
  .user-name { font-weight: 600; color: var(--text); margin-bottom: 0.25rem; }
  .user-email { font-size: 0.75rem; color: var(--text-muted); }
  .user-status { display: flex; align-items: center; gap: 0.375rem; padding: 0.25rem 0.75rem; border-radius: 6px; font-size: 0.75rem; font-weight: 600; }
  .user-status.locked { background: #fee2e2; color: #ef4444; }
  .user-status svg { width: 14px; height: 14px; }
  
  .user-details { padding: 1rem; background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; }
  .detail-header { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; font-weight: 600; color: var(--primary); margin-bottom: 1rem; }
  .detail-header svg { width: 18px; height: 18px; }
  .detail-body { display: flex; flex-direction: column; gap: 0.75rem; }
  .detail-row { display: flex; justify-content: space-between; font-size: 0.875rem; }
  .detail-label { color: var(--text-muted); font-weight: 500; }
  .detail-value { color: var(--text); font-weight: 600; }
  .status-locked { display: flex; align-items: center; gap: 0.375rem; color: #ef4444; }
  .status-locked svg { width: 14px; height: 14px; }
  
  .hint { font-size: 0.75rem; color: var(--text-muted); margin: 0; }
  
  .form-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1.5rem; border-top: 1px solid var(--border); }
  
  .btn-reset, .btn-unlock { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
  .btn-reset { background: white; border: 1px solid var(--border); color: var(--text); }
  .btn-reset:hover:not(:disabled) { background: var(--bg-alt); border-color: var(--primary); }
  .btn-unlock { background: var(--primary); border: none; color: white; }
  .btn-unlock:hover:not(:disabled) { background: var(--primary-dark); transform: translateY(-1px); box-shadow: var(--shadow-md); }
  .btn-reset:disabled, .btn-unlock:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-reset svg, .btn-unlock svg { width: 18px; height: 18px; }
  
  .spinner { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
</style>