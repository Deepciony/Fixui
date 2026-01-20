=== settings/./_components/SecuritySettings.svelte ===
<script lang="ts">
  import { appState } from '../../_lib/stores/appState';
  
  export let data: any;
  export let onPasswordChange: (data: any) => void;
  
  $: lang = $appState.currentLang;
  
  let formData = { ...data };
  let isChanging = false;
  let showPassword = false;
  
  function validatePassword() {
    if (formData.newPassword !== formData.confirmPassword) {
      return lang === 'th' ? 'รหัสผ่านไม่ตรงกัน' : 'Passwords do not match';
    }
    if (formData.newPassword.length < 8) {
      return lang === 'th' ? 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' : 'Password must be at least 8 characters';
    }
    return null;
  }
  
  async function handleSubmit() {
    const error = validatePassword();
    if (error) {
      alert(error);
      return;
    }
    
    isChanging = true;
    await onPasswordChange({
      currentPassword: formData.currentPassword,
      newPassword: formData.newPassword
    });
    isChanging = false;
  }
</script>

<div class="security-settings">
  <h2 class="section-title">{lang === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Change Password'}</h2>
  
  <div class="form-fields">
    <div class="form-group">
      <label for="current-password">
        {lang === 'th' ? 'รหัสผ่านปัจจุบัน' : 'Current Password'} 
        <span class="required">*</span>
      </label>
      <div class="password-input">
        <input 
          type={showPassword ? 'text' : 'password'}
          id="current-password" 
          class="input"
          bind:value={formData.currentPassword}
          required
        />
      </div>
    </div>
    
    <div class="form-group">
      <label for="new-password">
        {lang === 'th' ? 'รหัสผ่านใหม่' : 'New Password'} 
        <span class="required">*</span>
      </label>
      <div class="password-input">
        <input 
          type={showPassword ? 'text' : 'password'}
          id="new-password" 
          class="input"
          bind:value={formData.newPassword}
          required
        />
      </div>
      <p class="hint">{lang === 'th' ? 'อย่างน้อย 8 ตัวอักษร' : 'At least 8 characters'}</p>
    </div>
    
    <div class="form-group">
      <label for="confirm-password">
        {lang === 'th' ? 'ยืนยันรหัสผ่านใหม่' : 'Confirm New Password'} 
        <span class="required">*</span>
      </label>
      <div class="password-input">
        <input 
          type={showPassword ? 'text' : 'password'}
          id="confirm-password" 
          class="input"
          bind:value={formData.confirmPassword}
          required
        />
      </div>
    </div>
    
    <div class="form-group">
      <label class="checkbox-label">
        <input type="checkbox" bind:checked={showPassword} />
        <span>{lang === 'th' ? 'แสดงรหัสผ่าน' : 'Show passwords'}</span>
      </label>
    </div>
  </div>
  
  <div class="security-tips">
    <h3 class="tips-title">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {lang === 'th' ? 'คำแนะนำ' : 'Password Tips'}
    </h3>
    <ul class="tips-list">
      <li>{lang === 'th' ? 'ใช้อักษรพิมพ์ใหญ่และพิมพ์เล็ก' : 'Use uppercase and lowercase letters'}</li>
      <li>{lang === 'th' ? 'รวมตัวเลขและสัญลักษณ์' : 'Include numbers and symbols'}</li>
      <li>{lang === 'th' ? 'อย่างน้อย 8 ตัวอักษร' : 'At least 8 characters long'}</li>
      <li>{lang === 'th' ? 'อย่าใช้ข้อมูลส่วนตัว' : 'Avoid personal information'}</li>
    </ul>
  </div>
  
  <div class="form-actions">
    <button class="btn-save" on:click={handleSubmit} disabled={isChanging}>
      {isChanging ? (lang === 'th' ? 'กำลังเปลี่ยน...' : 'Changing...') : (lang === 'th' ? 'เปลี่ยนรหัสผ่าน' : 'Change Password')}
    </button>
  </div>
</div>

<style>
  .security-settings { padding: 0; }
  .section-title { font-size: 1.5rem; font-weight: 700; color: var(--text); margin: 0 0 1.5rem; }
  
  .form-fields { display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 2rem; }
  .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
  .form-group label { font-size: 0.875rem; font-weight: 600; color: var(--text); }
  .required { color: var(--error); }
  .password-input { position: relative; }
  .input { width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 8px; font-size: 0.875rem; }
  .input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1); }
  .hint { font-size: 0.75rem; color: var(--text-muted); margin: 0; }
  
  .checkbox-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; font-size: 0.875rem; }
  .checkbox-label input { cursor: pointer; }
  
  .security-tips { padding: 1.25rem; background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 8px; margin-bottom: 2rem; }
  .tips-title { display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; font-weight: 600; color: var(--primary); margin: 0 0 0.75rem; }
  .tips-title svg { width: 18px; height: 18px; }
  .tips-list { margin: 0; padding-left: 1.5rem; }
  .tips-list li { font-size: 0.875rem; color: var(--text); margin-bottom: 0.25rem; }
  
  .form-actions { display: flex; justify-content: flex-end; }
  .btn-save { padding: 0.75rem 1.5rem; background: var(--primary); color: white; border: none; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; }
  .btn-save:hover:not(:disabled) { background: var(--primary-dark); }
  .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
</style>