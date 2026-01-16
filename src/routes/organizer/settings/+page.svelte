=== settings/./+page.svelte ===
<script lang="ts">
  import { onMount } from 'svelte';
  import { auth } from '../_lib/stores/auth';
  import { appState } from '../_lib/stores/appState';
  import api from '../_lib/api/client';
  import { endpoints } from '../_lib/api/endpoints';
  import { t } from '../_lib/i18n';
  import LoadingSpinner from '../_lib/components/LoadingSpinner.svelte';
  import ErrorMessage from '../_lib/components/ErrorMessage.svelte';
  import SuccessAlert from '../_lib/components/SuccessAlert.svelte';
  import ProfileForm from './_components/ProfileForm.svelte';
  import LanguageToggle from './_components/LanguageToggle.svelte';
  import SecuritySettings from './_components/SecuritySettings.svelte';
  
  $: lang = $appState.currentLang;
  
  let isLoading = true;
  let errorMessage = '';
  let successMessage = '';
  let activeTab: 'profile' | 'security' | 'preferences' = 'profile';
  
  // Profile data
  let profileData = {
    name: '',
    email: '',
    phone: '',
    department: '',
    avatar: null as string | null
  };
  
  // Security data
  let securityData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  
  async function loadProfile() {
    isLoading = true;
    errorMessage = '';
    
    try {
      const response = await api.get(endpoints.users.profile);
      profileData = {
        name: response.data.name || '',
        email: response.data.email || '',
        phone: response.data.phone || '',
        department: response.data.department || '',
        avatar: response.data.avatar || null
      };
    } catch (error: any) {
      errorMessage = error.response?.data?.message || (lang === 'th' ? 'โหลดข้อมูลล้มเหลว' : 'Failed to load profile');
      console.error('Error loading profile:', error);
    } finally {
      isLoading = false;
    }
  }
  
  async function handleProfileUpdate(data: any) {
    errorMessage = '';
    successMessage = '';
    
    try {
      await api.put(endpoints.users.updateProfile, data);
      successMessage = lang === 'th' ? 'อัปเดตข้อมูลสำเร็จ' : 'Profile updated successfully';
      await loadProfile();
    } catch (error: any) {
      errorMessage = error.response?.data?.message || (lang === 'th' ? 'อัปเดตข้อมูลล้มเหลว' : 'Failed to update profile');
    }
  }
  
  async function handlePasswordChange(data: any) {
    errorMessage = '';
    successMessage = '';
    
    try {
      await api.post(endpoints.users.changePassword, data);
      successMessage = lang === 'th' ? 'เปลี่ยนรหัสผ่านสำเร็จ' : 'Password changed successfully';
      securityData = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
    } catch (error: any) {
      errorMessage = error.response?.data?.message || (lang === 'th' ? 'เปลี่ยนรหัสผ่านล้มเหลว' : 'Failed to change password');
    }
  }
  
  onMount(() => {
    loadProfile();
  });
</script>

<div class="settings-page">
  <div class="page-header">
    <h1 class="page-title">{t('settings')}</h1>
    <p class="page-subtitle">
      {lang === 'th' ? 'จัดการบัญชีและการตั้งค่าของคุณ' : 'Manage your account and preferences'}
    </p>
  </div>
  
  <div class="settings-layout">
    <div class="settings-sidebar">
      <nav class="tabs">
        <button 
          class="tab-btn" 
          class:active={activeTab === 'profile'}
          on:click={() => activeTab = 'profile'}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {lang === 'th' ? 'โปรไฟล์' : 'Profile'}
        </button>
        
        <button 
          class="tab-btn" 
          class:active={activeTab === 'security'}
          on:click={() => activeTab = 'security'}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          {lang === 'th' ? 'ความปลอดภัย' : 'Security'}
        </button>
        
        <button 
          class="tab-btn" 
          class:active={activeTab === 'preferences'}
          on:click={() => activeTab = 'preferences'}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {lang === 'th' ? 'การตั้งค่า' : 'Preferences'}
        </button>
      </nav>
    </div>
    
    <div class="settings-content">
      {#if successMessage}
        <SuccessAlert message={successMessage} autoDismiss={true} />
      {/if}
      
      {#if errorMessage}
        <ErrorMessage message={errorMessage} onDismiss={() => errorMessage = ''} />
      {/if}
      
      {#if isLoading}
        <LoadingSpinner size="lg" />
      {:else}
        {#if activeTab === 'profile'}
          <ProfileForm
            data={profileData}
            onSave={handleProfileUpdate}
          />
        {:else if activeTab === 'security'}
          <SecuritySettings
            data={securityData}
            onPasswordChange={handlePasswordChange}
          />
        {:else if activeTab === 'preferences'}
          <div class="preferences-section">
            <h2 class="section-title">{lang === 'th' ? 'การตั้งค่า' : 'Preferences'}</h2>
            
            <div class="preference-item">
              <LanguageToggle />
            </div>
            
            <div class="preference-item">
              <h3 class="preference-title">{lang === 'th' ? 'การแจ้งเตือน' : 'Notifications'}</h3>
              <p class="preference-desc">{lang === 'th' ? 'จัดการการแจ้งเตือนของคุณ' : 'Manage your notification preferences'}</p>
              <div class="notification-settings">
                <label class="switch-label">
                  <input type="checkbox" class="switch-input" checked />
                  <span class="switch-slider"></span>
                  <span class="switch-text">{lang === 'th' ? 'แจ้งเตือนทางอีเมล' : 'Email notifications'}</span>
                </label>
                
                <label class="switch-label">
                  <input type="checkbox" class="switch-input" checked />
                  <span class="switch-slider"></span>
                  <span class="switch-text">{lang === 'th' ? 'แจ้งเตือนกิจกรรมใหม่' : 'New event notifications'}</span>
                </label>
                
                <label class="switch-label">
                  <input type="checkbox" class="switch-input" />
                  <span class="switch-slider"></span>
                  <span class="switch-text">{lang === 'th' ? 'แจ้งเตือนการอนุมัติ' : 'Approval notifications'}</span>
                </label>
              </div>
            </div>
          </div>
        {/if}
      {/if}
    </div>
  </div>
</div>

<style>
  .settings-page { max-width: 1200px; margin: 0 auto; padding: 2rem; }
  .page-header { margin-bottom: 2rem; }
  .page-title { font-size: 2rem; font-weight: 700; color: var(--text); margin: 0; }
  .page-subtitle { font-size: 0.875rem; color: var(--text-muted); margin: 0.5rem 0 0; }
  
  .settings-layout { display: grid; grid-template-columns: 250px 1fr; gap: 2rem; }
  
  .tabs { display: flex; flex-direction: column; gap: 0.5rem; background: white; border: 1px solid var(--border); border-radius: 12px; padding: 0.5rem; }
  .tab-btn { display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem 1rem; background: transparent; border: none; border-radius: 8px; font-size: 0.875rem; font-weight: 500; color: var(--text); cursor: pointer; transition: all 0.2s; text-align: left; }
  .tab-btn:hover { background: var(--bg-alt); }
  .tab-btn.active { background: var(--primary); color: white; }
  .tab-btn svg { width: 20px; height: 20px; }
  
  .settings-content { background: white; border: 1px solid var(--border); border-radius: 12px; padding: 2rem; min-height: 400px; }
  
  .section-title { font-size: 1.5rem; font-weight: 700; color: var(--text); margin: 0 0 1.5rem; }
  
  .preference-item { margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid var(--border); }
  .preference-item:last-child { border-bottom: none; margin-bottom: 0; padding-bottom: 0; }
  
  .preference-title { font-size: 1rem; font-weight: 600; color: var(--text); margin: 0 0 0.25rem; }
  .preference-desc { font-size: 0.875rem; color: var(--text-muted); margin: 0 0 1rem; }
  
  .notification-settings { display: flex; flex-direction: column; gap: 1rem; }
  
  .switch-label { display: flex; align-items: center; gap: 1rem; cursor: pointer; }
  .switch-input { display: none; }
  .switch-slider { position: relative; width: 48px; height: 24px; background: var(--border); border-radius: 12px; transition: all 0.3s; }
  .switch-slider::before { content: ''; position: absolute; width: 18px; height: 18px; left: 3px; top: 3px; background: white; border-radius: 50%; transition: all 0.3s; }
  .switch-input:checked + .switch-slider { background: var(--primary); }
  .switch-input:checked + .switch-slider::before { transform: translateX(24px); }
  .switch-text { font-size: 0.875rem; color: var(--text); }
  
  @media (max-width: 768px) {
    .settings-page { padding: 1rem; }
    .settings-layout { grid-template-columns: 1fr; gap: 1rem; }
    .tabs { flex-direction: row; overflow-x: auto; }
    .tab-btn { white-space: nowrap; }
  }
</style>



