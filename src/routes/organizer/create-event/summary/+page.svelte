<script lang="ts">
  import { goto } from '$app/navigation';
  import { eventForm } from '../../_lib/stores/eventForm';
  import { appState } from '../../_lib/stores/appState';
  import { t } from '../../_lib/i18n';
  import { onMount } from 'svelte';
  // ✅ 1. Import endpoints เพื่อใช้ URL ที่ถูกต้อง
  import { endpoints } from '../../_lib/api/endpoints';

  $: lang = $appState.currentLang;
  $: storeData = $eventForm as any;
  $: editingEventId = storeData?.editingEventId;

  let formData = {
    imagePreview: null as string | null,
    title: '',
    description: '',
    location: '',
    eventType: 'single_day',
    maxCheckinsPerUser: 1,
    sDay: '',
    sMonth: '',
    sYear: '',
    eDay: '',
    eMonth: '',
    eYear: '',
    startTime: '',
    endTime: '',
    totalSlots: null as number | null,
    distanceKm: null as number | null,
    holidays: [] as string[],
    holidayMode: null as string | null,
    totalRewards: null as number | null,
    rewards: [] as any[],
    isPublic: true,
    isActive: true
  };

  let isSubmitting = false;
  let error = '';

  onMount(() => {
    formData = { ...$eventForm } as any;
  });

  function formatDate(day: string, month: string, year: string) {
    if (!day || !month || !year) return '';
    const monthNames = lang === 'th'
      ? ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = parseInt(month) - 1;
    return `${day} ${monthNames[monthIndex]} ${year}`;
  }

  function getEventTypeLabel(type: string) {
    const types: Record<string, { th: string; en: string }> = {
      single_day: { th: 'กิจกรรมวันเดียว', en: 'Single Day Event' },
      multi_day: { th: 'กิจกรรมหลายวัน', en: 'Multi-Day Event' }
    };
    return types[type]?.[lang] || type;
  }

  function getHolidayModeLabel(mode: string | null) {
    if (!mode) return lang === 'th' ? 'ไม่มี' : 'None';
    const modes: Record<string, { th: string; en: string }> = {
      weekends: { th: 'ไม่นับวันหยุดสุดสัปดาห์', en: 'Exclude Weekends' },
      none: { th: 'ไม่มีวันหยุด', en: 'No Holidays' },
      specific: { th: `${formData.holidays.length} วันที่เลือก`, en: `${formData.holidays.length} specific dates` }
    };
    return modes[mode]?.[lang] || mode;
  }

  // ✅ 2. แก้ไข Logic การ Submit ให้แยก Event และ Rewards
  async function handleSubmit() {
    isSubmitting = true;
    error = '';
    console.log("🚀 Starting handleSubmit..."); // [Log จุดเริ่มต้น]

    try {
      // --- STEP 1: Submit Event Data ---
      console.log("📦 Step 1: Preparing Event Data..."); // [Log ขั้นตอน]
      const formDataToSend = new FormData();

      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'rewards' || key === 'totalRewards') return;
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            formDataToSend.append(key, JSON.stringify(value));
          } else if (typeof value === 'object' && key !== 'imageFile') {
            formDataToSend.append(key, JSON.stringify(value));
          } else if (key !== 'imagePreview') {
            formDataToSend.append(key, String(value));
          }
        }
      });

      // เช็คว่า URL ถูกต้องไหม
      const eventUrl = editingEventId 
        ? endpoints.events.update(editingEventId)
        : endpoints.events.create;
      
      console.log("🔗 Event API URL:", eventUrl); // [Log URL]

      // ยิง API
      const response = await fetch(eventUrl, {
        method: editingEventId ? 'PUT' : 'POST',
        body: formDataToSend,
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
        }
      });

      console.log("📡 Event API Status:", response.status); // [Log สถานะตอบกลับ]

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.error("❌ Event Creation Failed:", errData); // [Log Error]
        throw new Error(errData.detail || errData.message || 'Failed to submit event');
      }

      const eventResult = await response.json();
      const eventId = eventResult.id || eventResult.data?.id || editingEventId;
      
      console.log("✅ Event Created Successfully! ID:", eventId); // [Log สำคัญ: ได้ ID มาไหม]

      // --- STEP 2: Create Reward Config ---
      if (eventId && formData.rewards && formData.rewards.length > 0) {
          console.log("🎁 Step 2: Creating Rewards for Event ID:", eventId); // [Log เริ่มสร้าง Reward]
          
          let endsAtStr = new Date().toISOString();
          if (formData.eYear && formData.eMonth && formData.eDay && formData.endTime) {
              const y = formData.eYear;
              const m = formData.eMonth.toString().padStart(2, '0');
              const d = formData.eDay.toString().padStart(2, '0');
              const time = formData.endTime;
              endsAtStr = `${y}-${m}-${d}T${time}:00`;
          }

          const configPayload = {
              event_id: eventId,
              name: "Default Leaderboard",
              description: "Generated from event creation",
              max_reward_recipients: Number(formData.totalRewards) || 0,
              required_completions: 1, 
              starts_at: new Date().toISOString(),
              ends_at: new Date(endsAtStr).toISOString(),
              reward_tiers: formData.rewards.map((r, index) => ({
                  tier: index + 1,
                  reward_name: r.name,
                  required_completions: Number(r.requirement),
                  quantity: 0,
                  min_rank: 0,
                  max_rank: 0
              }))
          };

          console.log("📤 Reward Config Payload:", configPayload); // [Log ดูข้อมูลที่จะส่งไป]

          const rewardRes = await fetch(endpoints.rewards.createConfig, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${localStorage.getItem('access_token') || ''}`
              },
              body: JSON.stringify(configPayload)
          });

          console.log("📡 Reward API Status:", rewardRes.status); // [Log ผลลัพธ์ Reward API]

          if (!rewardRes.ok) {
              const rewardErr = await rewardRes.json().catch(() => ({}));
              console.warn('⚠️ Failed to create reward config:', rewardErr); // [Log เตือนถ้าสร้าง Reward ไม่ผ่าน]
          } else {
              console.log("✅ Reward Config Created Successfully");
          }
      } else {
          console.log("ℹ️ No rewards to create or missing Event ID");
      }
      
      console.log("🏁 Process Complete. Redirecting...");
      eventForm.reset();
      goto('/organizer/events');
      
    } catch (err: any) {
      console.error("💥 Critical Error in handleSubmit:", err); // [Log Error ใหญ่สุด]
      error = err.message || 'An error occurred';
      isSubmitting = false;
    }
  }
  
  function handleBack() {
    goto('/organizer/create-event/rewards');
  }

  function handleEdit(section: string) {
    goto(`/organizer/create-event/${section}`);
  }
</script>

<div class="ce-grid-layout">
  <div class="ce-summary-header">
    <div class="ce-summary-icon">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    </div>
    <div>
      <h3 class="ce-summary-title">{lang === 'th' ? 'ตรวจสอบข้อมูลก่อนเผยแพร่' : 'Review Before Publishing'}</h3>
      <p class="ce-summary-desc">{lang === 'th' ? 'กรุณาตรวจสอบข้อมูลให้ถูกต้องก่อนเผยแพร่กิจกรรม' : 'Please verify all information before publishing your event'}</p>
    </div>
  </div>

  <div class="ce-card ce-summary-card">
    <div class="ce-card-head">
      <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
        <svg class="ce-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <span>{lang === 'th' ? 'ข้อมูลทั่วไป' : 'General Information'}</span>
      </div>
      <button type="button" class="ce-btn-edit" on:click={() => handleEdit('general')}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        {t('edit')}
      </button>
    </div>

    {#if formData.imagePreview}
      <div class="ce-summary-image">
        <img src={formData.imagePreview} alt="Event banner" on:error={(e) => { e.currentTarget.src = '/image 7.png'; }} />
      </div>
    {/if}

    <div class="ce-summary-grid">
      <div class="ce-summary-item">
        <span class="ce-summary-label">{t('eventName')}</span>
        <span class="ce-summary-value">{formData.title || '-'}</span>
      </div>

      <div class="ce-summary-item">
        <span class="ce-summary-label">{t('eventType')}</span>
        <span class="ce-summary-badge">{getEventTypeLabel(formData.eventType)}</span>
      </div>

      <div class="ce-summary-item full-width">
        <span class="ce-summary-label">{t('description')}</span>
        <span class="ce-summary-value">{formData.description || '-'}</span>
      </div>

      <div class="ce-summary-item full-width">
        <span class="ce-summary-label">{t('location')}</span>
        <span class="ce-summary-value">{formData.location || '-'}</span>
      </div>

      {#if formData.eventType === 'multi_day'}
        <div class="ce-summary-item">
          <span class="ce-summary-label">{t('maxCheckinsPerUser')}</span>
          <span class="ce-summary-value">{formData.maxCheckinsPerUser} {t('checkinTimes')}</span>
        </div>
      {/if}
    </div>
  </div>

  <div class="ce-card ce-summary-card">
    <div class="ce-card-head">
      <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
        <svg class="ce-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
        <span>{lang === 'th' ? 'วันเวลาและจำนวน' : 'Date, Time & Capacity'}</span>
      </div>
      <button type="button" class="ce-btn-edit" on:click={() => handleEdit('capacity')}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        {t('edit')}
      </button>
    </div>

    <div class="ce-summary-grid">
      <div class="ce-summary-item">
        <span class="ce-summary-label">{t('startDateLabel')}</span>
        <span class="ce-summary-value">{formatDate(formData.sDay, formData.sMonth, formData.sYear)}</span>
      </div>

      <div class="ce-summary-item">
        <span class="ce-summary-label">{t('endDateLabel')}</span>
        <span class="ce-summary-value">{formatDate(formData.eDay, formData.eMonth, formData.eYear)}</span>
      </div>

      <div class="ce-summary-item">
        <span class="ce-summary-label">{t('startTimeLabel')}</span>
        <span class="ce-summary-value">{formData.startTime || '-'}</span>
      </div>

      <div class="ce-summary-item">
        <span class="ce-summary-label">{t('endTimeLabel')}</span>
        <span class="ce-summary-value">{formData.endTime || '-'}</span>
      </div>

      <div class="ce-summary-item">
        <span class="ce-summary-label">{t('capacityLabel')}</span>
        <span class="ce-summary-value-highlight">{formData.totalSlots || '-'} {lang === 'th' ? 'ที่นั่ง' : 'slots'}</span>
      </div>

      <div class="ce-summary-item">
        <span class="ce-summary-label">{t('distanceLabel')}</span>
        <span class="ce-summary-value">{formData.distanceKm || 0} km</span>
      </div>

      <div class="ce-summary-item full-width">
        <span class="ce-summary-label">{t('holidaysAndExclusions')}</span>
        <span class="ce-summary-value">{getHolidayModeLabel(formData.holidayMode)}</span>
      </div>
    </div>
  </div>

  <div class="ce-card ce-summary-card">
    <div class="ce-card-head">
      <div style="display: flex; align-items: center; gap: 10px; flex: 1;">
        <svg class="ce-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path>
        </svg>
        <span>{lang === 'th' ? 'รางวัล' : 'Rewards'}</span>
      </div>
      <button type="button" class="ce-btn-edit" on:click={() => handleEdit('rewards')}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        {t('edit')}
      </button>
    </div>

    <div class="ce-summary-item" style="margin-bottom: 16px;">
      <span class="ce-summary-label">{lang === 'th' ? 'จำนวนของรางวัลทั้งหมด' : 'Total Reward Items'}</span>
      <span class="ce-summary-value-highlight">{formData.totalRewards || 0} {lang === 'th' ? 'ชิ้น' : 'items'}</span>
    </div>

    {#if formData.rewards.length > 0}
      <div class="ce-rewards-grid">
        {#each formData.rewards.sort((a: any, b: any) => (a.requirement || 0) - (b.requirement || 0)) as reward}
          <div class="ce-reward-summary-card">
            <div class="ce-reward-rounds">{reward.requirement || 0} {lang === 'th' ? 'รอบ' : 'rounds'}</div>
            <div class="ce-reward-name">{reward.name || '-'}</div>
          </div>
        {/each}
      </div>
    {:else}
      <div class="ce-empty-state">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
        <span>{lang === 'th' ? 'ยังไม่มีรางวัล' : 'No rewards configured'}</span>
      </div>
    {/if}
  </div>

  {#if error}
    <div class="ce-error-msg">
      ⚠️ {error}
    </div>
  {/if}

  <div class="ce-nav-buttons">
    <button type="button" class="ce-btn-cancel" on:click={handleBack} disabled={isSubmitting}>
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
      </svg>
      {t('back')}
    </button>
    <button type="button" class="ce-btn-save ce-btn-publish" on:click={handleSubmit} disabled={isSubmitting}>
      {#if isSubmitting}
        <div class="btn-loader"></div>
      {:else}
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
      {/if}
      {editingEventId ? (lang === 'th' ? 'บันทึกการแก้ไข' : 'Save Changes') : (lang === 'th' ? 'เผยแพร่กิจกรรม' : 'Publish Event')}
    </button>
  </div>
</div>

<style>
 
  
  .ce-summary-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 24px;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 95, 70, 0.05));
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 20px;
    margin-bottom: 24px;
  }

  .ce-summary-icon {
    width: 56px;
    height: 56px;
    background: rgba(16, 185, 129, 0.15);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .ce-summary-icon svg {
    width: 28px;
    height: 28px;
    color: #10b981;
  }

  .ce-summary-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: #10b981;
    margin: 0 0 4px 0;
  }

  .ce-summary-desc {
    font-size: 0.9rem;
    color: #6ee7b7;
    margin: 0;
  }

  .ce-summary-card {
    position: relative;
  }

  .ce-btn-edit {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 10px;
    color: #60a5fa;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .ce-btn-edit:hover {
    background: rgba(59, 130, 246, 0.2);
    border-color: #3b82f6;
  }

  .ce-btn-edit svg {
    width: 16px;
    height: 16px;
  }

  .ce-summary-image {
    width: 100%;
    height: 200px;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 20px;
  }

  .ce-summary-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .ce-summary-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .ce-summary-item {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .ce-summary-item.full-width {
    grid-column: 1 / -1;
  }

  .ce-summary-label {
    font-size: 0.75rem;
    color: #94a3b8;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .ce-summary-value {
    font-size: 0.95rem;
    color: #e2e8f0;
    font-weight: 500;
  }

  .ce-summary-value-highlight {
    font-size: 1.1rem;
    color: #10b981;
    font-weight: 700;
  }

  .ce-summary-badge {
    display: inline-flex;
    align-items: center;
    padding: 6px 12px;
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 8px;
    color: #10b981;
    font-size: 0.85rem;
    font-weight: 600;
    width: fit-content;
  }

  .ce-rewards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 12px;
  }

  .ce-reward-summary-card {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(234, 88, 12, 0.05));
    border: 1px solid rgba(245, 158, 11, 0.3);
    border-radius: 12px;
    padding: 16px;
    text-align: center;
  }

  .ce-reward-rounds {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 700;
    display: inline-block;
    margin-bottom: 8px;
  }

  .ce-reward-name {
    color: #f0fdf4;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .ce-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    padding: 40px;
    color: #64748b;
  }

  .ce-empty-state svg {
    width: 48px;
    height: 48px;
  }

  .ce-btn-publish {
    background: linear-gradient(135deg, #10b981, #059669);
    box-shadow: 0 8px 16px rgba(16, 185, 129, 0.3);
  }

  .ce-btn-publish:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 24px rgba(16, 185, 129, 0.4);
  }

  .ce-btn-publish:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  .btn-loader {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  @media (max-width: 768px) {
    .ce-summary-grid {
      grid-template-columns: 1fr;
    }

    .ce-rewards-grid {
      grid-template-columns: 1fr;
    }
  }
</style>