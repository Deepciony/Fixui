=== settings/./_components/ProfileForm.svelte ===
<script lang="ts">
  import { appState } from '../../_lib/stores/appState';
  
  export let data: any;
  export let onSave: (data: any) => void;
  
  $: lang = $appState.currentLang;
  
  let formData = { ...data };
  let avatarFile: File | null = null;
  let avatarPreview: string | null = data.avatar;
  let isSaving = false;
  
  function handleAvatarChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert(lang === 'th' ? 'ไฟล์ใหญ่เกิน 2MB' : 'File size exceeds 2MB');
        return;
      }
      
      avatarFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        avatarPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }
  
  async function handleSubmit() {
    isSaving = true;
    
    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('email', formData.email);
    submitData.append('phone', formData.phone);
    submitData.append('department', formData.department);
    
    if (avatarFile) {
      submitData.append('avatar', avatarFile);
    }
    
    await onSave(submitData);
    isSaving = false;
  }
</script>

<div class="profile-form">
  <h2 class="section-title">{lang === 'th' ? 'ข้อมูลส่วนตัว' : 'Personal Information'}</h2>
  
  <div class="avatar-section">
    <div class="avatar-preview">
      {#if avatarPreview}
        <img src={avatarPreview} alt="Avatar" />
      {:else}
        <div class="avatar-placeholder">
          {formData.name?.[0] || 'U'}
        </div>
      {/if}
    </div>
    
    <div class="avatar-actions">
      <label for="avatar-upload" class="btn-upload">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
        {lang === 'th' ? 'อัพโหลดรูป' : 'Upload Image'}
      </label>
      <input 
        type="file" 
        id="avatar-upload" 
        accept="image/*"
        on:change={handleAvatarChange}
        hidden
      />
      <p class="upload-hint">PNG, JPG (max 2MB)</p>
    </div>
  </div>
  
  <div class="form-fields">
    <div class="form-group">
      <label for="name">{lang === 'th' ? 'ชื่อ' : 'Name'} <span class="required">*</span></label>
      <input 
        type="text" 
        id="name" 
        class="input"
        bind:value={formData.name}
        required
      />
    </div>
    
    <div class="form-group">
      <label for="email">{lang === 'th' ? 'อีเมล' : 'Email'} <span class="required">*</span></label>
      <input 
        type="email" 
        id="email" 
        class="input"
        bind:value={formData.email}
        required
      />
    </div>
    
    <div class="form-group">
      <label for="phone">{lang === 'th' ? 'เบอร์โทรศัพท์' : 'Phone'}</label>
      <input 
        type="tel" 
        id="phone" 
        class="input"
        bind:value={formData.phone}
      />
    </div>
    
    <div class="form-group">
      <label for="department">{lang === 'th' ? 'แผนก' : 'Department'}</label>
      <input 
        type="text" 
        id="department" 
        class="input"
        bind:value={formData.department}
      />
    </div>
  </div>
  
  <div class="form-actions">
    <button class="btn-save" on:click={handleSubmit} disabled={isSaving}>
      {isSaving ? (lang === 'th' ? 'กำลังบันทึก...' : 'Saving...') : (lang === 'th' ? 'บันทึก' : 'Save Changes')}
    </button>
  </div>
</div>

<style>
  .section-title { font-size: 1.5rem; font-weight: 700; color: var(--text); margin: 0 0 1.5rem; }
  
  .avatar-section { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid var(--border); }
  .avatar-preview { width: 100px; height: 100px; border-radius: 50%; overflow: hidden; border: 3px solid var(--border); }
  .avatar-preview img { width: 100%; height: 100%; object-fit: cover; }
  .avatar-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: var(--primary); color: white; font-size: 2rem; font-weight: 600; }
  
  .avatar-actions { flex: 1; }
  .btn-upload { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1rem; background: var(--bg-alt); border: 1px solid var(--border); border-radius: 8px; font-size: 0.875rem; font-weight: 500; cursor: pointer; transition: all 0.2s; }
  .btn-upload:hover { background: var(--bg-hover); border-color: var(--primary); }
  .btn-upload svg { width: 16px; height: 16px; }
  .upload-hint { font-size: 0.75rem; color: var(--text-muted); margin: 0.5rem 0 0; }
  
  .form-fields { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; margin-bottom: 2rem; }
  .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
  .form-group label { font-size: 0.875rem; font-weight: 600; color: var(--text); }
  .required { color: var(--error); }
  .input { padding: 0.75rem; border: 1px solid var(--border); border-radius: 8px; font-size: 0.875rem; }
  .input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1); }
  
  .form-actions { display: flex; justify-content: flex-end; }
  .btn-save { padding: 0.75rem 1.5rem; background: var(--primary); color: white; border: none; border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
  .btn-save:hover:not(:disabled) { background: var(--primary-dark); }
  .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
  
  @media (max-width: 768px) { .form-fields { grid-template-columns: 1fr; } .avatar-section { flex-direction: column; text-align: center; } }
</style>