=== verify-code/./_components/CodeInput.svelte ===
<script lang="ts">
  import { appState } from '../../_lib/stores/appState';
  
  export let code: string;
  export let onSubmit: (code: string) => void;
  export let isVerifying: boolean;
  export let mode: 'check-in' | 'check-out';
  
  $: lang = $appState.currentLang;
  
  let codeDigits = ['', '', '', '', '', ''];
  let inputRefs: HTMLInputElement[] = [];
  
  function handleInput(index: number, event: Event) {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    
    if (value.length > 1) {
      target.value = value[0];
      codeDigits[index] = value[0];
    } else {
      codeDigits[index] = value;
    }
    
    // Auto-focus next input
    if (value && index < 5) {
      inputRefs[index + 1]?.focus();
    }
    
    // Auto-submit when complete
    const fullCode = codeDigits.join('');
    if (fullCode.length === 6) {
      code = fullCode;
      onSubmit(fullCode);
    }
  }
  
  function handleKeydown(index: number, event: KeyboardEvent) {
    if (event.key === 'Backspace' && !codeDigits[index] && index > 0) {
      inputRefs[index - 1]?.focus();
    }
  }
  
  function handlePaste(event: ClipboardEvent) {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const digits = pastedData.replace(/\D/g, '').slice(0, 6).split('');
    
    codeDigits = [...digits, ...Array(6 - digits.length).fill('')];
    
    if (digits.length === 6) {
      code = digits.join('');
      onSubmit(code);
    }
  }
  
  function handleManualSubmit() {
    const fullCode = codeDigits.join('');
    if (fullCode.length === 6) {
      code = fullCode;
      onSubmit(fullCode);
    }
  }
</script>

<div class="code-input">
  <div class="input-header">
    <h3 class="input-title">
      {lang === 'th' ? 'กรอกรหัส' : 'Enter Code'}
    </h3>
    <p class="input-desc">
      {lang === 'th' ? 'กรอกรหัส 6 หลักเพื่อ' : 'Enter 6-digit code to'} 
      {mode === 'check-in' ? (lang === 'th' ? 'เช็คอิน' : 'check-in') : (lang === 'th' ? 'เช็คเอาท์' : 'check-out')}
    </p>
  </div>
  
  <div class="code-inputs" on:paste={handlePaste}>
    {#each codeDigits as digit, i}
      <input
        type="text"
        class="code-digit"
        maxlength="1"
        pattern="[0-9]"
        inputmode="numeric"
        bind:value={codeDigits[i]}
        bind:this={inputRefs[i]}
        on:input={(e) => handleInput(i, e)}
        on:keydown={(e) => handleKeydown(i, e)}
        disabled={isVerifying}
      />
    {/each}
  </div>
  
  <button 
    class="btn-submit" 
    on:click={handleManualSubmit}
    disabled={codeDigits.join('').length !== 6 || isVerifying}
  >
    {#if isVerifying}
      <svg class="spinner" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25" />
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="4" fill="none" />
      </svg>
      {lang === 'th' ? 'กำลังตรวจสอบ...' : 'Verifying...'}
    {:else}
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {lang === 'th' ? 'ตรวจสอบ' : 'Verify'}
    {/if}
  </button>
</div>

<style>
  .code-input { display: flex; flex-direction: column; align-items: center; gap: 2rem; }
  
  .input-header { text-align: center; }
  .input-title { font-size: 1.25rem; font-weight: 600; color: var(--text); margin: 0 0 0.5rem; }
  .input-desc { font-size: 0.875rem; color: var(--text-muted); margin: 0; }
  
  .code-inputs { display: flex; gap: 0.75rem; }
  .code-digit { width: 56px; height: 64px; text-align: center; font-size: 1.75rem; font-weight: 600; border: 2px solid var(--border); border-radius: 12px; background: white; transition: all 0.2s; }
  .code-digit:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1); }
  .code-digit:disabled { background: var(--bg-alt); opacity: 0.6; }
  
  .btn-submit { display: flex; align-items: center; gap: 0.5rem; padding: 0.875rem 2rem; background: var(--primary); color: white; border: none; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
  .btn-submit:hover:not(:disabled) { background: var(--primary-dark); transform: translateY(-1px); box-shadow: var(--shadow-md); }
  .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-submit svg { width: 20px; height: 20px; }
  
  .spinner { animation: spin 1s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }
  
  @media (max-width: 640px) {
    .code-digit { width: 48px; height: 56px; font-size: 1.5rem; }
    .code-inputs { gap: 0.5rem; }
  }
</style>