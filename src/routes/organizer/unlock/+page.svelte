=== unlock/./+page.svelte ===
<script lang="ts">
  import { appState } from '../_lib/stores/appState';
  import api from '../_lib/api/client';
  import { endpoints } from '../_lib/api/endpoints';
  import { t } from '../_lib/i18n';
  import ErrorMessage from '../_lib/components/ErrorMessage.svelte';
  import SuccessAlert from '../_lib/components/SuccessAlert.svelte';
  import UnlockForm from './_components/UnlockForm.svelte';
  
  $: lang = $appState.currentLang;
  
  let errorMessage = '';
  let successMessage = '';
  let isUnlocking = false;
  
  async function handleUnlock(data: { email: string; reason: string }) {
    isUnlocking = true;
    errorMessage = '';
    successMessage = '';
    
    try {
      await api.post(endpoints.users.unlock, data);
      successMessage = lang === 'th' 
        ? 'ปลดล็อคบัญชีสำเร็จ อีเมลยืนยันได้ถูกส่งไปยังผู้ใช้แล้ว' 
        : 'Account unlocked successfully. Confirmation email has been sent to the user.';
    } catch (error: any) {
      errorMessage = error.response?.data?.message || (lang === 'th' ? 'ปลดล็อคบัญชีล้มเหลว' : 'Failed to unlock account');
      console.error('Error unlocking account:', error);
    } finally {
      isUnlocking = false;
    }
  }
</script>

<div class="unlock-page">
  <div class="page-header">
    <h1 class="page-title">{t('unlockAccount')}</h1>
    <p class="page-subtitle">
      {lang === 'th' ? 'ปลดล็อคบัญชีผู้ใช้ที่ถูกระงับ' : 'Unlock suspended user accounts'}
    </p>
  </div>
  
  {#if successMessage}
    <SuccessAlert message={successMessage} autoDismiss={true} />
  {/if}
  
  {#if errorMessage}
    <ErrorMessage message={errorMessage} onDismiss={() => errorMessage = ''} />
  {/if}
  
  <div class="unlock-container">
    <div class="info-section">
      <div class="info-card">
        <div class="info-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="info-content">
          <h3 class="info-title">{lang === 'th' ? 'เกี่ยวกับการปลดล็อค' : 'About Unlocking'}</h3>
          <p class="info-text">
            {lang === 'th' 
              ? 'บัญชีผู้ใช้อาจถูกล็อคเนื่องจากการละเมิดกฎ หรือกิจกรรมที่น่าสงสัย การปลดล็อคจะทำให้ผู้ใช้สามารถเข้าถึงระบบได้อีกครั้ง'
              : 'User accounts may be locked due to policy violations or suspicious activity. Unlocking will restore their access to the system.'}
          </p>
        </div>
      </div>
      
      <div class="info-card warning">
        <div class="info-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <div class="info-content">
          <h3 class="info-title">{lang === 'th' ? 'ข้อควรระวัง' : 'Important Notes'}</h3>
          <ul class="info-list">
            <li>{lang === 'th' ? 'ตรวจสอบเหตุผลการล็อคก่อนปลดล็อค' : 'Review lock reason before unlocking'}</li>
            <li>{lang === 'th' ? 'ระบุเหตุผลในการปลดล็อคอย่างชัดเจน' : 'Provide clear unlock reason'}</li>
            <li>{lang === 'th' ? 'ผู้ใช้จะได้รับอีเมลแจ้งเตือน' : 'User will receive email notification'}</li>
            <li>{lang === 'th' ? 'บันทึกการปลดล็อคจะถูกเก็บไว้' : 'Unlock action will be logged'}</li>
          </ul>
        </div>
      </div>
      
      <div class="stats-card">
        <div class="stat-item">
          <div class="stat-value">24h</div>
          <div class="stat-label">{lang === 'th' ? 'เวลาตอบกลับโดยเฉลี่ย' : 'Avg Response Time'}</div>
        </div>
        <div class="stat-divider"></div>
        <div class="stat-item">
          <div class="stat-value">95%</div>
          <div class="stat-label">{lang === 'th' ? 'อัตราความสำเร็จ' : 'Success Rate'}</div>
        </div>
      </div>
    </div>
    
    <div class="form-section">
      <UnlockForm onUnlock={handleUnlock} {isUnlocking} />
    </div>
  </div>
</div>

<style>
  .unlock-page { max-width: 1200px; margin: 0 auto; padding: 2rem; }
  .page-header { margin-bottom: 2rem; }
  .page-title { font-size: 2rem; font-weight: 700; color: var(--text); margin: 0; }
  .page-subtitle { font-size: 0.875rem; color: var(--text-muted); margin: 0.5rem 0 0; }
  
  .unlock-container { display: grid; grid-template-columns: 1fr 1.2fr; gap: 2rem; }
  
  .info-section { display: flex; flex-direction: column; gap: 1.5rem; }
  
  .info-card { background: white; border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; display: flex; gap: 1rem; }
  .info-card.warning { background: #fffbeb; border-color: #fbbf24; }
  
  .info-icon { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: #dbeafe; border-radius: 12px; flex-shrink: 0; }
  .info-card.warning .info-icon { background: #fef3c7; }
  .info-icon svg { width: 24px; height: 24px; color: #3b82f6; }
  .info-card.warning .info-icon svg { color: #f59e0b; }
  
  .info-content { flex: 1; }
  .info-title { font-size: 1rem; font-weight: 600; color: var(--text); margin: 0 0 0.5rem; }
  .info-text { font-size: 0.875rem; color: var(--text-muted); margin: 0; line-height: 1.6; }
  
  .info-list { margin: 0; padding-left: 1.25rem; }
  .info-list li { font-size: 0.875rem; color: var(--text); margin-bottom: 0.5rem; line-height: 1.5; }
  
  .stats-card { background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%); border-radius: 12px; padding: 1.5rem; display: flex; align-items: center; justify-content: space-around; }
  .stat-item { text-align: center; }
  .stat-value { font-size: 2rem; font-weight: 700; color: white; margin-bottom: 0.25rem; }
  .stat-label { font-size: 0.75rem; color: rgba(255, 255, 255, 0.9); text-transform: uppercase; letter-spacing: 0.5px; }
  .stat-divider { width: 1px; height: 48px; background: rgba(255, 255, 255, 0.3); }
  
  @media (max-width: 968px) {
    .unlock-page { padding: 1rem; }
    .unlock-container { grid-template-columns: 1fr; }
    .info-section { order: 2; }
    .form-section { order: 1; }
  }
</style>

