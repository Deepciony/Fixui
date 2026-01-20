=== ./_components/ImageUpload.svelte ===
<script lang="ts">
  import { appState } from '../../_lib/stores/appState';
  
  export let imagePreview: string | null = null;
  export let onUpload: (file: File) => void;
  export let onRemove: () => void;
  
  $: lang = $appState.currentLang;
  
  let fileInput: HTMLInputElement;
  
  function handleFileChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(lang === 'th' ? 'ไฟล์ใหญ่เกิน 5MB' : 'File size exceeds 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        alert(lang === 'th' ? 'กรุณาเลือกไฟล์รูปภาพ' : 'Please select an image file');
        return;
      }
      
      onUpload(file);
    }
  }
  
  function triggerUpload() {
    fileInput?.click();
  }
</script>

<div class="image-upload">
  <input
    type="file"
    accept="image/*"
    bind:this={fileInput}
    on:change={handleFileChange}
    hidden
  />
  
  {#if imagePreview}
    <div class="preview-container">
      <img src={imagePreview} alt="Preview" class="preview-image" />
      <button class="remove-btn" on:click={onRemove} type="button" aria-label={lang === 'th' ? 'ลบรูปภาพ' : 'Remove image'}>
        <svg aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  {:else}
    <button class="upload-area" on:click={triggerUpload} type="button">
      <svg aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <span class="upload-text">
        {lang === 'th' ? 'คลิกเพื่ออัพโหลดรูปภาพ' : 'Click to upload image'}
      </span>
      <span class="upload-hint">PNG, JPG (max 5MB)</span>
    </button>
  {/if}
</div>

<style>
  .image-upload {
    width: 100%;
  }
  
  .preview-container {
    position: relative;
    width: 100%;
    max-width: 400px;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: var(--shadow-md);
  }
  
  .preview-image {
    width: 100%;
    height: auto;
    display: block;
  }
  
  .remove-btn {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    width: 36px;
    height: 36px;
    padding: 0;
    background: rgba(0, 0, 0, 0.7);
    border: none;
    border-radius: 50%;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .remove-btn:hover {
    background: rgba(0, 0, 0, 0.9);
    transform: scale(1.1);
  }
  
  .remove-btn svg {
    width: 20px;
    height: 20px;
  }
  
  .upload-area {
    width: 100%;
    padding: 3rem 2rem;
    border: 2px dashed var(--border);
    border-radius: 12px;
    background: var(--bg-alt);
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }
  
  .upload-area:hover {
    border-color: var(--primary);
    background: white;
  }
  
  .upload-area svg {
    width: 48px;
    height: 48px;
    color: var(--primary);
  }
  
  .upload-text {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text);
  }
  
  .upload-hint {
    font-size: 0.75rem;
    color: var(--text-muted);
  }
</style>