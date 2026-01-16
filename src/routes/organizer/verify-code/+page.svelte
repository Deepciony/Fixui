=== verify-code/./+page.svelte ===
<script lang="ts">
  import { appState } from '../_lib/stores/appState';
  import api from '../_lib/api/client';
  import { endpoints } from '../_lib/api/endpoints';
  import { t } from '../_lib/i18n';
  import ErrorMessage from '../_lib/components/ErrorMessage.svelte';
  import SuccessAlert from '../_lib/components/SuccessAlert.svelte';
  import CodeInput from './_components/CodeInput.svelte';
  import QRScanner from './_components/QRScanner.svelte';
  import ParticipantInfo from './_components/ParticipantInfo.svelte';
  import AutoToggle from './_components/AutoToggle.svelte';
  
  $: lang = $appState.currentLang;
  
  let mode: 'check-in' | 'check-out' = 'check-in';
  let inputMode: 'manual' | 'qr' = 'manual';
  let code = '';
  let isVerifying = false;
  let participant: any = null;
  let successMessage = '';
  let errorMessage = '';
  let autoMode = false;
  let autoTimer: any = null;
  
  async function verifyCode(codeValue: string) {
    if (!codeValue || isVerifying) return;
    
    isVerifying = true;
    errorMessage = '';
    successMessage = '';
    participant = null;
    
    try {
      const response = await api.post(endpoints.participants.verify, {
        code: codeValue,
        action: mode
      });
      
      participant = response.data;
      successMessage = lang === 'th' 
        ? `${mode === 'check-in' ? 'เช็คอิน' : 'เช็คเอาท์'}สำเร็จ!`
        : `${mode === 'check-in' ? 'Check-in' : 'Check-out'} successful!`;
      
      // Auto-clear after 3 seconds in auto mode
      if (autoMode) {
        autoTimer = setTimeout(() => {
          handleReset();
        }, 3000);
      }
    } catch (error: any) {
      errorMessage = error.response?.data?.message || (lang === 'th' ? 'ตรวจสอบรหัสล้มเหลว' : 'Verification failed');
      console.error('Error verifying code:', error);
      
      // Auto-clear error after 3 seconds in auto mode
      if (autoMode) {
        autoTimer = setTimeout(() => {
          handleReset();
        }, 3000);
      }
    } finally {
      isVerifying = false;
    }
  }
  
  function handleCodeSubmit(submittedCode: string) {
    verifyCode(submittedCode);
  }
  
  function handleQRScan(scannedCode: string) {
    code = scannedCode;
    verifyCode(scannedCode);
  }
  
  function handleReset() {
    if (autoTimer) {
      clearTimeout(autoTimer);
      autoTimer = null;
    }
    code = '';
    participant = null;
    successMessage = '';
    errorMessage = '';
  }
  
  function handleModeChange(newMode: 'check-in' | 'check-out') {
    mode = newMode;
    handleReset();
  }
  
  function handleInputModeChange(newInputMode: 'manual' | 'qr') {
    inputMode = newInputMode;
    handleReset();
  }
</script>

<div class="verify-code-page">
  <div class="page-header">
    <h1 class="page-title">{t('verifyCode')}</h1>
    <p class="page-subtitle">
      {lang === 'th' ? 'ตรวจสอบรหัสเช็คอิน/เช็คเอาท์' : 'Verify check-in/check-out codes'}
    </p>
  </div>
  
  <div class="controls-bar">
    <div class="mode-selector">
      <button 
        class="mode-btn" 
        class:active={mode === 'check-in'}
        on:click={() => handleModeChange('check-in')}
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
        {lang === 'th' ? 'เช็คอิน' : 'Check-in'}
      </button>
      
      <button 
        class="mode-btn" 
        class:active={mode === 'check-out'}
        on:click={() => handleModeChange('check-out')}
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        {lang === 'th' ? 'เช็คเอาท์' : 'Check-out'}
      </button>
    </div>
    
    <div class="input-mode-selector">
      <button 
        class="input-mode-btn" 
        class:active={inputMode === 'manual'}
        on:click={() => handleInputModeChange('manual')}
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        {lang === 'th' ? 'กรอกเอง' : 'Manual'}
      </button>
      
      <button 
        class="input-mode-btn" 
        class:active={inputMode === 'qr'}
        on:click={() => handleInputModeChange('qr')}
      >
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
        QR Scanner
      </button>
    </div>
    
    <AutoToggle bind:enabled={autoMode} />
  </div>
  
  {#if successMessage}
    <SuccessAlert message={successMessage} autoDismiss={autoMode} />
  {/if}
  
  {#if errorMessage}
    <ErrorMessage message={errorMessage} onDismiss={() => errorMessage = ''} />
  {/if}
  
  <div class="verify-section">
    {#if inputMode === 'manual'}
      <CodeInput
        bind:code
        onSubmit={handleCodeSubmit}
        {isVerifying}
        {mode}
      />
    {:else}
      <QRScanner
        onScan={handleQRScan}
        {isVerifying}
        {mode}
      />
    {/if}
    
    {#if participant}
      <ParticipantInfo {participant} {mode} />
    {/if}
  </div>
  
  {#if participant || errorMessage}
    <div class="action-buttons">
      <button class="btn-reset" on:click={handleReset}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        {lang === 'th' ? 'ตรวจสอบใหม่' : 'Check Another'}
      </button>
    </div>
  {/if}
</div>

<style>
  .verify-code-page { max-width: 900px; margin: 0 auto; padding: 2rem; }
  .page-header { text-align: center; margin-bottom: 2rem; }
  .page-title { font-size: 2rem; font-weight: 700; color: var(--text); margin: 0; }
  .page-subtitle { font-size: 0.875rem; color: var(--text-muted); margin: 0.5rem 0 0; }
  
  .controls-bar { display: flex; gap: 1rem; margin-bottom: 2rem; justify-content: center; flex-wrap: wrap; }
  
  .mode-selector, .input-mode-selector { display: flex; gap: 0.5rem; background: white; border: 1px solid var(--border); border-radius: 8px; padding: 0.25rem; }
  
  .mode-btn, .input-mode-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.25rem; background: transparent; border: none; border-radius: 6px; font-size: 0.875rem; font-weight: 600; color: var(--text); cursor: pointer; transition: all 0.2s; }
  .mode-btn:hover, .input-mode-btn:hover { background: var(--bg-alt); }
  .mode-btn.active, .input-mode-btn.active { background: var(--primary); color: white; }
  .mode-btn svg, .input-mode-btn svg { width: 18px; height: 18px; }
  
  .verify-section { background: white; border: 1px solid var(--border); border-radius: 12px; padding: 2rem; margin-bottom: 1.5rem; }
  
  .action-buttons { display: flex; justify-content: center; }
  .btn-reset { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: white; border: 1px solid var(--border); border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
  .btn-reset:hover { background: var(--bg-alt); border-color: var(--primary); }
  .btn-reset svg { width: 18px; height: 18px; }
  
  @media (max-width: 768px) {
    .verify-code-page { padding: 1rem; }
    .controls-bar { flex-direction: column; }
    .mode-selector, .input-mode-selector { justify-content: center; }
  }
</style>




