=== ./general/+page.svelte ===
<script lang="ts">
  import { eventForm } from '../../_lib/stores/eventForm';
  import { appState } from '../../_lib/stores/appState';
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import api from '../../_lib/api/client';
  import { endpoints } from '../../_lib/api/endpoints';
  import { t } from '../../_lib/i18n';
  import { validateRequired } from '../../_lib/utils/validation';
  
  let imageInput: HTMLInputElement;
  
  $: lang = $appState.currentLang;
  
  // Load event if editing
  onMount(async () => {
    const eventId = $page.url.searchParams.get('id');
    if (eventId) {
      try {
        const response = await api.get(endpoints.events.get(parseInt(eventId)));
        const event = response.data;
        
        eventForm.update(state => ({
          ...state,
          editingEventId: event.id,
          title: event.title,
          description: event.description,
          location: event.location,
          imagePreview: event.imageUrl,
          eventType: event.eventType,
          allowDailyCheckin: event.allowDailyCheckin || false,
          maxCheckinsPerUser: event.maxCheckinsPerUser || 1,
          startDate: parseDate(event.startDate),
          endDate: parseDate(event.endDate),
          startTime: event.startTime,
          endTime: event.endTime
        }));
      } catch (error) {
        console.error('Error loading event:', error);
      }
    }
  });
  
  function parseDate(dateStr: string) {
    const d = new Date(dateStr);
    return {
      day: d.getDate().toString(),
      month: (d.getMonth() + 1).toString(),
      year: d.getFullYear().toString()
    };
  }
  
  function handleImageUpload(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert(lang === 'th' ? 'ไฟล์ใหญ่เกิน 5MB' : 'File size exceeds 5MB');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        eventForm.update(state => ({
          ...state,
          imagePreview: e.target?.result as string,
          imageFile: file
        }));
      };
      reader.readAsDataURL(file);
    }
  }
  
  function removeImage() {
    eventForm.update(state => ({
      ...state,
      imagePreview: null,
      imageFile: null
    }));
    if (imageInput) imageInput.value = '';
  }
  
  function validateForm(): boolean {
    const errors = new Map();
    
    if (!validateRequired($eventForm.title)) {
      errors.set('title', lang === 'th' ? 'กรุณากรอกชื่อกิจกรรม' : 'Event name is required');
    }
    
    if (!validateRequired($eventForm.location)) {
      errors.set('location', lang === 'th' ? 'กรุณากรอกสถานที่' : 'Location is required');
    }
    
    if (!validateRequired($eventForm.startDate.year)) {
      errors.set('startDate', lang === 'th' ? 'กรุณาเลือกวันที่เริ่ม' : 'Start date is required');
    }
    
    if (!validateRequired($eventForm.endDate.year)) {
      errors.set('endDate', lang === 'th' ? 'กรุณาเลือกวันที่สิ้นสุด' : 'End date is required');
    }
    
    if (!validateRequired($eventForm.startTime)) {
      errors.set('startTime', lang === 'th' ? 'กรุณากรอกเวลาเริ่ม' : 'Start time is required');
    }
    
    if (!validateRequired($eventForm.endTime)) {
      errors.set('endTime', lang === 'th' ? 'กรุณากรอกเวลาสิ้นสุด' : 'End time is required');
    }
    
    eventForm.update(state => ({
      ...state,
      validationErrors: errors
    }));
    
    return errors.size === 0;
  }
  
  function handleNext() {
    if (validateForm()) {
      goto('/organizer/create-event/capacity');
    }
  }
</script>

<div class="form-section">
  <h3 class="section-title">{t('general')}</h3>
  
  <!-- Title -->
  <div class="form-group">
    <label for="title">
      {lang === 'th' ? 'ชื่อกิจกรรม' : 'Event Name'}
      <span class="required">*</span>
    </label>
    <input
      id="title"
      type="text"
      class:error={$eventForm.validationErrors.has('title')}
      bind:value={$eventForm.title}
      placeholder={lang === 'th' ? 'กรอกชื่อกิจกรรม' : 'Enter event name'}
    />
    {#if $eventForm.validationErrors.has('title')}
      <span class="error-message">{$eventForm.validationErrors.get('title')}</span>
    {/if}
  </div>
  
  <!-- Description -->
  <div class="form-group">
    <label for="description">
      {lang === 'th' ? 'รายละเอียด' : 'Description'}
    </label>
    <textarea
      id="description"
      bind:value={$eventForm.description}
      rows="4"
      placeholder={lang === 'th' ? 'กรอกรายละเอียดกิจกรรม' : 'Enter event description'}
    ></textarea>
  </div>
  
  <!-- Location -->
  <div class="form-group">
    <label for="location">
      {lang === 'th' ? 'สถานที่' : 'Location'}
      <span class="required">*</span>
    </label>
    <input
      id="location"
      type="text"
      class:error={$eventForm.validationErrors.has('location')}
      bind:value={$eventForm.location}
      placeholder={lang === 'th' ? 'กรอกสถานที่จัดกิจกรรม' : 'Enter event location'}
    />
    {#if $eventForm.validationErrors.has('location')}
      <span class="error-message">{$eventForm.validationErrors.get('location')}</span>
    {/if}
  </div>
  
  <!-- Image Upload -->
  <div class="form-group">
    <label>
      {lang === 'th' ? 'รูปภาพกิจกรรม' : 'Event Image'}
    </label>
    
    {#if $eventForm.imagePreview}
      <div class="image-preview">
        <img src={$eventForm.imagePreview} alt="Event preview" />
        <button class="btn-remove-image" on:click={removeImage} type="button">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    {:else}
      <div class="upload-area">
        <input
          type="file"
          accept="image/*"
          on:change={handleImageUpload}
          bind:this={imageInput}
          id="image-upload"
          hidden
        />
        <label for="image-upload" class="upload-label">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{lang === 'th' ? 'คลิกเพื่ออัพโหลดรูปภาพ' : 'Click to upload image'}</span>
          <span class="upload-hint">PNG, JPG (max 5MB)</span>
        </label>
      </div>
    {/if}
  </div>
  
  <!-- Event Type -->
  <div class="form-group">
    <label>{lang === 'th' ? 'ประเภทกิจกรรม' : 'Event Type'}</label>
    <div class="radio-group">
      <label class="radio-label">
        <input
          type="radio"
          bind:group={$eventForm.eventType}
          value="single_day"
        />
        <div class="radio-content">
          <span class="radio-title">{lang === 'th' ? 'วันเดียว' : 'Single Day'}</span>
          <span class="radio-desc">{lang === 'th' ? 'เช็คอินได้ 1 ครั้ง' : 'One check-in only'}</span>
        </div>
      </label>
      
      <label class="radio-label">
        <input
          type="radio"
          bind:group={$eventForm.eventType}
          value="multi_day"
        />
        <div class="radio-content">
          <span class="radio-title">{lang === 'th' ? 'หลายวัน' : 'Multi Day'}</span>
          <span class="radio-desc">{lang === 'th' ? 'เช็คอินได้หลายครั้ง' : 'Multiple check-ins'}</span>
        </div>
      </label>
    </div>
  </div>
  
  {#if $eventForm.eventType === 'multi_day'}
    <div class="form-group">
      <label for="max-checkins">
        {lang === 'th' ? 'จำนวนเช็คอินสูงสุดต่อคน' : 'Max Check-ins Per User'}
      </label>
      <input
        id="max-checkins"
        type="number"
        min="1"
        bind:value={$eventForm.maxCheckinsPerUser}
      />
    </div>
  {/if}
  
  <!-- Date Range -->
  <div class="form-row">
    <div class="form-group">
      <label>
        {lang === 'th' ? 'วันที่เริ่ม' : 'Start Date'}
        <span class="required">*</span>
      </label>
      <div class="date-inputs">
        <input
          type="number"
          placeholder={lang === 'th' ? 'วัน' : 'Day'}
          min="1"
          max="31"
          class:error={$eventForm.validationErrors.has('startDate')}
          bind:value={$eventForm.startDate.day}
        />
        <input
          type="number"
          placeholder={lang === 'th' ? 'เดือน' : 'Month'}
          min="1"
          max="12"
          class:error={$eventForm.validationErrors.has('startDate')}
          bind:value={$eventForm.startDate.month}
        />
        <input
          type="number"
          placeholder={lang === 'th' ? 'ปี' : 'Year'}
          min="2024"
          class:error={$eventForm.validationErrors.has('startDate')}
          bind:value={$eventForm.startDate.year}
        />
      </div>
      {#if $eventForm.validationErrors.has('startDate')}
        <span class="error-message">{$eventForm.validationErrors.get('startDate')}</span>
      {/if}
    </div>
    
    <div class="form-group">
      <label>
        {lang === 'th' ? 'วันที่สิ้นสุด' : 'End Date'}
        <span class="required">*</span>
      </label>
      <div class="date-inputs">
        <input
          type="number"
          placeholder={lang === 'th' ? 'วัน' : 'Day'}
          min="1"
          max="31"
          class:error={$eventForm.validationErrors.has('endDate')}
          bind:value={$eventForm.endDate.day}
        />
        <input
          type="number"
          placeholder={lang === 'th' ? 'เดือน' : 'Month'}
          min="1"
          max="12"
          class:error={$eventForm.validationErrors.has('endDate')}
          bind:value={$eventForm.endDate.month}
        />
        <input
          type="number"
          placeholder={lang === 'th' ? 'ปี' : 'Year'}
          min="2024"
          class:error={$eventForm.validationErrors.has('endDate')}
          bind:value={$eventForm.endDate.year}
        />
      </div>
      {#if $eventForm.validationErrors.has('endDate')}
        <span class="error-message">{$eventForm.validationErrors.get('endDate')}</span>
      {/if}
    </div>
  </div>
  
  <!-- Time Range -->
  <div class="form-row">
    <div class="form-group">
      <label for="start-time">
        {lang === 'th' ? 'เวลาเริ่ม' : 'Start Time'}
        <span class="required">*</span>
      </label>
      <input
        id="start-time"
        type="time"
        class:error={$eventForm.validationErrors.has('startTime')}
        bind:value={$eventForm.startTime}
      />
      {#if $eventForm.validationErrors.has('startTime')}
        <span class="error-message">{$eventForm.validationErrors.get('startTime')}</span>
      {/if}
    </div>
    
    <div class="form-group">
      <label for="end-time">
        {lang === 'th' ? 'เวลาสิ้นสุด' : 'End Time'}
        <span class="required">*</span>
      </label>
      <input
        id="end-time"
        type="time"
        class:error={$eventForm.validationErrors.has('endTime')}
        bind:value={$eventForm.endTime}
      />
      {#if $eventForm.validationErrors.has('endTime')}
        <span class="error-message">{$eventForm.validationErrors.get('endTime')}</span>
      {/if}
    </div>
  </div>
  
  <!-- Actions -->
  <div class="form-actions">
    <button class="btn-secondary" on:click={() => goto('/organizer/events')} type="button">
      {t('cancel')}
    </button>
    <button class="btn-primary" on:click={handleNext} type="button">
      {t('next')}
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </button>
  </div>
</div>

<style>
  .form-section {
    background: white;
    border-radius: 12px;
    padding: 2rem;
    box-shadow: var(--shadow-sm);
  }
  
  .section-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text);
    margin: 0 0 2rem;
  }
  
  .form-group {
    margin-bottom: 1.5rem;
  }
  
  .form-group label {
    display: block;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 0.5rem;
  }
  
  .required {
    color: var(--error);
  }
  
  .form-group input:not([type="radio"]),
  .form-group textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 0.875rem;
    transition: all 0.2s;
  }
  
  .form-group input:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1);
  }
  
  .form-group input.error,
  .form-group textarea.error {
    border-color: var(--error);
  }
  
  .error-message {
    display: block;
    color: var(--error);
    font-size: 0.75rem;
    margin-top: 0.25rem;
  }
  
  .image-preview {
    position: relative;
    width: 100%;
    max-width: 400px;
    border-radius: 8px;
    overflow: hidden;
  }
  
  .image-preview img {
    width: 100%;
    height: auto;
    display: block;
  }
  
  .btn-remove-image {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 32px;
    height: 32px;
    padding: 0;
    background: rgba(0, 0, 0, 0.6);
    border: none;
    border-radius: 50%;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-remove-image:hover {
    background: rgba(0, 0, 0, 0.8);
  }
  
  .btn-remove-image svg {
    width: 18px;
    height: 18px;
  }
  
  .upload-area {
    border: 2px dashed var(--border);
    border-radius: 8px;
    padding: 2rem;
    text-align: center;
    transition: all 0.2s;
  }
  
  .upload-area:hover {
    border-color: var(--primary);
    background: var(--bg-alt);
  }
  
  .upload-label {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    color: var(--text-muted);
  }
  
  .upload-label svg {
    width: 48px;
    height: 48px;
    color: var(--primary);
  }
  
  .upload-hint {
    font-size: 0.75rem;
    color: var(--text-light);
  }
  
  .radio-group {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }
  
  .radio-label {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
    padding: 1rem;
    border: 2px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .radio-label:hover {
    border-color: var(--primary);
    background: var(--bg-alt);
  }
  
  .radio-label input[type="radio"] {
    margin-top: 0.25rem;
  }
  
  .radio-label input[type="radio"]:checked + .radio-content {
    color: var(--primary);
  }
  
  .radio-content {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .radio-title {
    font-weight: 600;
    font-size: 0.875rem;
  }
  
  .radio-desc {
    font-size: 0.75rem;
    color: var(--text-muted);
  }
  
  .form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
  }
  
  .date-inputs {
    display: grid;
    grid-template-columns: 1fr 1fr 1.5fr;
    gap: 0.5rem;
  }
  
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 1rem;
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 1px solid var(--border);
  }
  
  .btn-secondary,
  .btn-primary {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-secondary {
    background: transparent;
    border: 1px solid var(--border);
    color: var(--text);
  }
  
  .btn-secondary:hover {
    background: var(--bg-hover);
  }
  
  .btn-primary {
    background: var(--primary);
    color: white;
    border: none;
  }
  
  .btn-primary:hover {
    background: var(--primary-dark);
  }
  
  .btn-primary svg {
    width: 18px;
    height: 18px;
  }
  
  @media (max-width: 768px) {
    .form-section {
      padding: 1.5rem;
    }
    
    .form-row {
      grid-template-columns: 1fr;
    }
    
    .radio-group {
      grid-template-columns: 1fr;
    }
  }
</style>