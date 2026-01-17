<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import axios from 'axios';
  import Swal from 'sweetalert2';
  
  const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "");
  
  const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
  });
  
  api.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  
  type Language = "th" | "en";
  let currentLang: Language = "th";
  
  if (typeof localStorage !== "undefined") {
    const saved = localStorage.getItem("app_language");
    if (saved === "th" || saved === "en") currentLang = saved;
  }
  
  const translations = {
    th: {
      createNewEvent: "สร้างกิจกรรมใหม่",
      editEvent: "แก้ไขกิจกรรม",
      cancel: "ยกเลิก",
      publish: "เผยแพร่",
      update: "อัพเดท",
      fillAllFields: "กรุณากรอกข้อมูลให้ครบถ้วน",
      uploadEventBanner: "อัพโหลดแบนเนอร์กิจกรรม",
      changeImage: "เปลี่ยนรูปภาพ",
      basicInformation: "ข้อมูลพื้นฐาน",
      eventName: "ชื่อกิจกรรม",
      description: "รายละเอียด",
      location: "สถานที่",
      eventTypeTitle: "ประเภทกิจกรรม",
      singleDay: "วันเดียว",
      multiDay: "หลายวัน",
      singleDayDesc: "กิจกรรมจัดขึ้นในวันเดียว เช็คอินได้ 1 ครั้ง",
      multiDayDesc: "กิจกรรมหลายวัน สามารถเช็คอินได้หลายครั้ง",
      maxCheckinsPerUser: "จำนวนเช็คอินสูงสุดต่อคน",
      checkinTimes: "ครั้ง",
      dateAndTime: "วันที่และเวลา",
      startDateLabel: "วันที่เริ่ม",
      endDateLabel: "วันที่สิ้นสุด",
      startTimeLabel: "เวลาเริ่ม",
      endTimeLabel: "เวลาสิ้นสุด",
      dayPlaceholder: "วัน",
      monthPlaceholder: "เดือน",
      yearPlaceholder: "ปี",
      selectTime: "เลือกเวลา",
      capacityAndSettings: "จำนวนที่นั่งและการตั้งค่า",
      capacityLabel: "จำนวนที่นั่ง",
      distanceLabel: "ระยะทาง (กม.)",
      holidaysAndExclusions: "วันหยุดและข้อยกเว้น",
      noHolidaysOption: "ไม่มีวันหยุด",
      excludeWeekendsOption: "ไม่รวมวันเสาร์-อาทิตย์",
      specificDatesOption: "เลือกวันที่เฉพาะ",
      addDate: "เพิ่มวันที่",
      rewardsDistribution: "การแจกรางวัล",
      addTierBtn: "+ เพิ่มระดับ",
      tierLabel: "ระดับ",
      quotaLabel: "จำนวน",
      requirementLabel: "เงื่อนไข (รอบ)",
      rewardNameLabel: "ชื่อรางวัล",
      eventStatusTitle: "สถานะกิจกรรม",
      publicVisibility: "เผยแพร่สาธารณะ",
      activeOpen: "เปิดใช้งาน",
      error: "เกิดข้อผิดพลาด",
      success: "สำเร็จ",
      eventCreated: "สร้างกิจกรรมสำเร็จ!",
      eventUpdated: "อัพเดทกิจกรรมสำเร็จ!",
    },
    en: {
      createNewEvent: "Create New Event",
      editEvent: "Edit Event",
      cancel: "Cancel",
      publish: "Publish",
      update: "Update",
      fillAllFields: "Please fill in all required fields",
      uploadEventBanner: "Upload Event Banner",
      changeImage: "Change Image",
      basicInformation: "Basic Information",
      eventName: "Event Name",
      description: "Description",
      location: "Location",
      eventTypeTitle: "Event Type",
      singleDay: "Single Day",
      multiDay: "Multi-Day",
      singleDayDesc: "Event held in one day, check-in once",
      multiDayDesc: "Multi-day event, multiple check-ins allowed",
      maxCheckinsPerUser: "Max Check-ins Per User",
      checkinTimes: "times",
      dateAndTime: "Date & Time",
      startDateLabel: "Start Date",
      endDateLabel: "End Date",
      startTimeLabel: "Start Time",
      endTimeLabel: "End Time",
      dayPlaceholder: "Day",
      monthPlaceholder: "Month",
      yearPlaceholder: "Year",
      selectTime: "Select time",
      capacityAndSettings: "Capacity & Settings",
      capacityLabel: "Capacity",
      distanceLabel: "Distance (km)",
      holidaysAndExclusions: "Holidays & Exclusions",
      noHolidaysOption: "No Holidays",
      excludeWeekendsOption: "Exclude Weekends",
      specificDatesOption: "Specific Dates",
      addDate: "Add Date",
      rewardsDistribution: "Rewards Distribution",
      addTierBtn: "+ Add Tier",
      tierLabel: "Tier",
      quotaLabel: "Quota",
      requirementLabel: "Requirement (rounds)",
      rewardNameLabel: "Reward Name",
      eventStatusTitle: "Event Status",
      publicVisibility: "Public Visibility",
      activeOpen: "Active (Open)",
      error: "Error",
      success: "Success",
      eventCreated: "Event created successfully!",
      eventUpdated: "Event updated successfully!",
    },
  };
  
  $: lang = translations[currentLang];
  
  interface RewardTier {
    name: string;
    quota: number | null;
    requirement: number | null;
  }
  
  let formData = {
    title: "",
    description: "",
    location: "",
    sDay: "",
    sMonth: "",
    sYear: "",
    eDay: "",
    eMonth: "",
    eYear: "",
    startTime: "",
    endTime: "",
    totalSlots: null as number | null,
    distanceKm: null as number | null,
    holidayType: "none" as "none" | "weekends" | "specific",
    specificDates: [] as string[],
    tempSpecificDate: "",
    rewards: [{ name: "", quota: null as number | null, requirement: null as number | null }] as RewardTier[],
    isPublic: true,
    isActive: true,
    imagePreview: null as string | null,
    imageFile: null as File | null,
    eventType: "single_day" as "single_day" | "multi_day",
    maxCheckinsPerUser: 1,
  };
  
  let editingEventId: string | null = null;
  let validationErrors = new Set<string>();
  let activeDropdown: string | null = null;
  let fileInput: HTMLInputElement;
  
  const days = Array.from({ length: 31 }, (_, i) => i + 1);
  const months = ["01","02","03","04","05","06","07","08","09","10","11","12"];
  const monthNames = {
    th: ["มกราคม","กุมภาพันธ์","มีนาคม","เมษายน","พฤษภาคม","มิถุนายน","กรกฎาคม","สิงหาคม","กันยายน","ตุลาคม","พฤศจิกายน","ธันวาคม"],
    en: ["January","February","March","April","May","June","July","August","September","October","November","December"]
  };
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);
  const times = Array.from({ length: 96 }, (_, i) => {
    const h = Math.floor(i / 4);
    const m = (i % 4) * 15;
    return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}`;
  });
  
  $: displayMonths = monthNames[currentLang];
  
  function translateMonth(month: string): string {
    const idx = months.indexOf(month);
    return idx >= 0 ? displayMonths[idx] : "";
  }
  
  function toggleDropdown(name: string) {
    activeDropdown = activeDropdown === name ? null : name;
  }
  
  function selectOption(field: string, value: any) {
    (formData as any)[field] = String(value);
    formData = formData;
    activeDropdown = null;
  }
  
  function setEventType(type: "single_day" | "multi_day") {
    formData.eventType = type;
    if (type === "single_day") formData.maxCheckinsPerUser = 1;
  }
  
  function triggerFileInput() {
    fileInput?.click();
  }
  
  function handleImageUpload(e: Event) {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      formData.imageFile = file;
      const reader = new FileReader();
      reader.onload = (ev) => {
        formData.imagePreview = ev.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }
  
  function addSpecificDate() {
    if (formData.tempSpecificDate && !formData.specificDates.includes(formData.tempSpecificDate)) {
      formData.specificDates = [...formData.specificDates, formData.tempSpecificDate];
      formData.tempSpecificDate = "";
    }
  }
  
  function removeSpecificDate(date: string) {
    formData.specificDates = formData.specificDates.filter(d => d !== date);
  }
  
  function addRewardTier() {
    formData.rewards = [...formData.rewards, { name: "", quota: null, requirement: null }];
  }
  
  function removeRewardTier(index: number) {
    if (formData.rewards.length > 1) {
      formData.rewards = formData.rewards.filter((_, i) => i !== index);
    }
  }
  
  function validate(): boolean {
    validationErrors.clear();
    if (!formData.title) validationErrors.add("title");
    if (!formData.description) validationErrors.add("description");
    if (!formData.location) validationErrors.add("location");
    if (!formData.sDay || !formData.sMonth || !formData.sYear) validationErrors.add("startDate");
    if (!formData.eDay || !formData.eMonth || !formData.eYear) validationErrors.add("endDate");
    if (!formData.startTime) validationErrors.add("startTime");
    if (!formData.endTime) validationErrors.add("endTime");
    if (!formData.totalSlots) validationErrors.add("totalSlots");
    validationErrors = validationErrors;
    return validationErrors.size === 0;
  }
  
  async function submit() {
    if (!validate()) {
      Swal.fire({
        title: lang.error,
        text: lang.fillAllFields,
        icon: 'error',
        background: '#1e293b',
        color: '#fff',
        confirmButtonColor: '#10b981'
      });
      return;
    }
    
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        start_date: `${formData.sYear}-${formData.sMonth}-${formData.sDay}`,
        end_date: `${formData.eYear}-${formData.eMonth}-${formData.eDay}`,
        start_time: formData.startTime,
        end_time: formData.endTime,
        max_participants: formData.totalSlots,
        distance_km: formData.distanceKm || 0,
        event_type: formData.eventType,
        max_checkins_per_user: formData.maxCheckinsPerUser,
        holiday_type: formData.holidayType,
        specific_dates: formData.specificDates,
        rewards: formData.rewards.filter(r => r.name && r.quota && r.requirement),
        is_public: formData.isPublic,
        is_active: formData.isActive,
        image: formData.imagePreview,
      };
      
      if (editingEventId) {
        await api.put(`/api/events/${editingEventId}`, payload);
      } else {
        await api.post('/api/events', payload);
      }
      
      await Swal.fire({
        title: lang.success,
        text: editingEventId ? lang.eventUpdated : lang.eventCreated,
        icon: 'success',
        background: '#1e293b',
        color: '#fff',
        confirmButtonColor: '#10b981',
        timer: 1500,
        showConfirmButton: false
      });
      
      goto('/organizer/events');
    } catch (error) {
      console.error('Error:', error);
      Swal.fire({
        title: lang.error,
        text: 'Failed to save event',
        icon: 'error',
        background: '#1e293b',
        color: '#fff',
        confirmButtonColor: '#10b981'
      });
    }
  }
  
  function cancel() {
    goto('/organizer/events');
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div class="ce-wrapper" on:click={() => (activeDropdown = null)}>
  <div class="ce-container">
    <div class="ce-header">
      <h2 class="ce-title">{editingEventId ? lang.editEvent : lang.createNewEvent}</h2>
      <div class="ce-header-right">
        {#if validationErrors.size > 0}
          <div class="ce-validation-alert">
            <svg class="ce-alert-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span class="ce-alert-text">{lang.fillAllFields}</span>
          </div>
        {/if}
        <div class="ce-header-actions">
          <button class="ce-btn-cancel" on:click={cancel}>{lang.cancel}</button>
          <button class="ce-btn-save" on:click={submit}>{editingEventId ? lang.update : lang.publish}</button>
        </div>
      </div>
    </div>

    <div class="ce-grid-layout">
      <div class="ce-card ce-img-card" class:has-img={formData.imagePreview} on:click|stopPropagation={triggerFileInput}>
        <input type="file" accept="image/*" bind:this={fileInput} on:change={handleImageUpload} hidden />
        {#if formData.imagePreview}
          <img src={formData.imagePreview} alt="Preview" class="ce-preview-img" />
          <div class="ce-overlay"><span>{lang.changeImage}</span></div>
        {:else}
          <div class="ce-upload-placeholder">
            <div class="ce-icon-upload">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <span>{lang.uploadEventBanner}</span>
          </div>
        {/if}
      </div>

      <div class="ce-card ce-form-card">
        <div class="ce-card-head">
          <svg class="ce-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <span>{lang.basicInformation}</span>
        </div>

        <div class="ce-input-group">
          <label for="title">{lang.eventName} <span class="ce-req">*</span></label>
          <input id="title" type="text" bind:value={formData.title} placeholder={currentLang === "th" ? "ชื่อกิจกรรมอย่างเป็นทางการ" : "Official Event Name"} class="ce-input" class:error={validationErrors.has("title")} />
        </div>

        <div class="ce-input-group">
          <label for="description">{lang.description} <span class="ce-req">*</span></label>
          <textarea id="description" bind:value={formData.description} placeholder={currentLang === "th" ? "รายละเอียดกิจกรรม..." : "Event details..."} class="ce-textarea" class:error={validationErrors.has("description")}></textarea>
        </div>

        <div class="ce-input-group">
          <label for="location">{lang.location} <span class="ce-req">*</span></label>
          <input id="location" type="text" bind:value={formData.location} placeholder={currentLang === "th" ? "สถานที่จัดกิจกรรม" : "Location"} class="ce-input" class:error={validationErrors.has("location")} />
        </div>
      </div>

      <div class="ce-card ce-config-card">
        <div class="ce-card-head">
          <svg class="ce-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path>
          </svg>
          <span>{lang.eventTypeTitle}</span>
        </div>

        <div class="ce-event-type-buttons">
          <button type="button" class="ce-event-type-btn" class:active={formData.eventType === "single_day"} on:click={() => setEventType("single_day")}>
            <div class="ce-event-type-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
              </svg>
            </div>
            <div class="ce-event-type-content">
              <span class="ce-event-type-title">{lang.singleDay}</span>
              <span class="ce-event-type-desc">{lang.singleDayDesc}</span>
            </div>
            {#if formData.eventType === "single_day"}
              <div class="ce-event-type-check">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            {/if}
          </button>

          <button type="button" class="ce-event-type-btn" class:active={formData.eventType === "multi_day"} on:click={() => setEventType("multi_day")}>
            <div class="ce-event-type-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zM9 12h.01M15 12h.01M9 16h.01M15 16h.01"></path>
              </svg>
            </div>
            <div class="ce-event-type-content">
              <span class="ce-event-type-title">{lang.multiDay}</span>
              <span class="ce-event-type-desc">{lang.multiDayDesc}</span>
            </div>
            {#if formData.eventType === "multi_day"}
              <div class="ce-event-type-check">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            {/if}
          </button>
        </div>

        {#if formData.eventType === "multi_day"}
          <div class="ce-checkin-section">
            <span class="ce-checkin-label">{lang.maxCheckinsPerUser}</span>
            <div class="ce-checkin-stepper">
              <button type="button" class="ce-stepper-btn" on:click={() => { if (formData.maxCheckinsPerUser > 1) formData.maxCheckinsPerUser--; }} disabled={formData.maxCheckinsPerUser <= 1}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 12H6"></path>
                </svg>
              </button>
              <div class="ce-stepper-value">{formData.maxCheckinsPerUser}</div>
              <button type="button" class="ce-stepper-btn" on:click={() => { if (formData.maxCheckinsPerUser < 365) formData.maxCheckinsPerUser++; }} disabled={formData.maxCheckinsPerUser >= 365}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v12m6-6H6"></path>
                </svg>
              </button>
              <span class="ce-stepper-unit">{lang.checkinTimes}</span>
            </div>
          </div>
        {/if}
      </div>

      <div class="ce-card ce-config-card">
        <div class="ce-card-head">
          <svg class="ce-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          <span>{lang.dateAndTime}</span>
        </div>

        <div class="ce-input-group">
          <label>{lang.startDateLabel} <span class="ce-req">*</span></label>
          <div class="ce-date-row" class:error={validationErrors.has("startDate")}>
            <div class="ce-dd-wrap flex-1-5">
              <div class="ce-trigger" on:click|stopPropagation={() => toggleDropdown("sDay")}>
                <input type="text" value={formData.sDay} placeholder={lang.dayPlaceholder} class="ce-input-dis" readonly />
                <span class="ce-arrow">▼</span>
              </div>
              {#if activeDropdown === "sDay"}
                <div class="ce-options" on:click|stopPropagation>
                  {#each days as d}
                    <button class="ce-opt" on:click|stopPropagation={() => selectOption("sDay", d)}>{d}</button>
                  {/each}
                </div>
              {/if}
            </div>
            
            <div class="ce-dd-wrap flex-2">
              <div class="ce-trigger" on:click|stopPropagation={() => toggleDropdown("sMonth")}>
                <input type="text" value={translateMonth(formData.sMonth)} placeholder={lang.monthPlaceholder} class="ce-input-dis" readonly />
                <span class="ce-arrow">▼</span>
              </div>
              {#if activeDropdown === "sMonth"}
                <div class="ce-options" on:click|stopPropagation>
                  {#each months as m, idx}
                    <button class="ce-opt" on:click|stopPropagation={() => selectOption("sMonth", m)}>{displayMonths[idx]}</button>
                  {/each}
                </div>
              {/if}
            </div>
            
            <div class="ce-dd-wrap flex-1-5">
              <div class="ce-trigger" on:click|stopPropagation={() => toggleDropdown("sYear")}>
                <input type="text" value={formData.sYear} placeholder={lang.yearPlaceholder} class="ce-input-dis" readonly />
                <span class="ce-arrow">▼</span>
              </div>
              {#if activeDropdown === "sYear"}
                <div class="ce-options" on:click|stopPropagation>
                  {#each years as y}
                    <button class="ce-opt" on:click|stopPropagation={() => selectOption("sYear", y)}>{y}</button>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        </div>

        <div class="ce-input-group">
          <label>{lang.endDateLabel} <span class="ce-req">*</span></label>
          <div class="ce-date-row" class:error={validationErrors.has("endDate")}>
            <div class="ce-dd-wrap flex-1-5">
              <div class="ce-trigger" on:click|stopPropagation={() => toggleDropdown("eDay")}>
                <input type="text" value={formData.eDay} placeholder={lang.dayPlaceholder} class="ce-input-dis" readonly />
                <span class="ce-arrow">▼</span>
              </div>
              {#if activeDropdown === "eDay"}
                <div class="ce-options" on:click|stopPropagation>
                  {#each days as d}
                    <button class="ce-opt" on:click|stopPropagation={() => selectOption("eDay", d)}>{d}</button>
                  {/each}
                </div>
              {/if}
            </div>
            
            <div class="ce-dd-wrap flex-2">
              <div class="ce-trigger" on:click|stopPropagation={() => toggleDropdown("eMonth")}>
                <input type="text" value={translateMonth(formData.eMonth)} placeholder={lang.monthPlaceholder} class="ce-input-dis" readonly />
                <span class="ce-arrow">▼</span>
              </div>
              {#if activeDropdown === "eMonth"}
                <div class="ce-options" on:click|stopPropagation>
                  {#each months as m, idx}
                    <button class="ce-opt" on:click|stopPropagation={() => selectOption("eMonth", m)}>{displayMonths[idx]}</button>
                  {/each}
                </div>
              {/if}
            </div>
            
            <div class="ce-dd-wrap flex-1-5">
              <div class="ce-trigger" on:click|stopPropagation={() => toggleDropdown("eYear")}>
                <input type="text" value={formData.eYear} placeholder={lang.yearPlaceholder} class="ce-input-dis" readonly />
                <span class="ce-arrow">▼</span>
              </div>
              {#if activeDropdown === "eYear"}
                <div class="ce-options" on:click|stopPropagation>
                  {#each years as y}
                    <button class="ce-opt" on:click|stopPropagation={() => selectOption("eYear", y)}>{y}</button>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        </div>

        <div class="ce-dual-row">
          <div class="ce-input-group">
            <label>{lang.startTimeLabel} <span class="ce-req">*</span></label>
            <div class="ce-dd-wrap">
              <div class="ce-trigger" on:click|stopPropagation={() => toggleDropdown("startTime")}>
                <input type="text" value={formData.startTime} placeholder={lang.selectTime} class="ce-input-dis" class:error={validationErrors.has("startTime")} readonly />
                <span class="ce-arrow">▼</span>
              </div>
              {#if activeDropdown === "startTime"}
                <div class="ce-options time-scroll" on:click|stopPropagation>
                  {#each times as t}
                    <button class="ce-opt" on:click|stopPropagation={() => selectOption("startTime", t)}>{t}</button>
                  {/each}
                </div>
              {/if}
            </div>
          </div>

          <div class="ce-input-group">
            <label>{lang.endTimeLabel} <span class="ce-req">*</span></label>
            <div class="ce-dd-wrap">
              <div class="ce-trigger" on:click|stopPropagation={() => toggleDropdown("endTime")}>
                <input type="text" value={formData.endTime} placeholder={lang.selectTime} class="ce-input-dis" class:error={validationErrors.has("endTime")} readonly />
                <span class="ce-arrow">▼</span>
              </div>
              {#if activeDropdown === "endTime"}
                <div class="ce-options time-scroll" on:click|stopPropagation>
                  {#each times as t}
                    <button class="ce-opt" on:click|stopPropagation={() => selectOption("endTime", t)}>{t}</button>
                  {/each}
                </div>
              {/if}
            </div>
          </div>
        </div>
      </div>

      <div class="ce-card ce-config-card">
        <div class="ce-card-head">
          <svg class="ce-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
          </svg>
          <span>{lang.capacityAndSettings}</span>
        </div>

        <div class="ce-dual-row">
          <div class="ce-input-group">
            <label>{lang.capacityLabel} <span class="ce-req">*</span></label>
            <input type="number" bind:value={formData.totalSlots} placeholder="100" class="ce-input" class:error={validationErrors.has("totalSlots")} min="1" />
          </div>

          <div class="ce-input-group">
            <label>{lang.distanceLabel}</label>
            <input type="number" bind:value={formData.distanceKm} placeholder="5.0" class="ce-input" min="0" step="0.1" />
          </div>
        </div>
      </div>

      <div class="ce-card ce-config-card">
        <div class="ce-card-head">
          <svg class="ce-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
          </svg>
          <span>{lang.holidaysAndExclusions}</span>
        </div>

        <div class="ce-holiday-options">
          <label class="ce-radio-option">
            <input type="radio" bind:group={formData.holidayType} value="none" />
            <span>{lang.noHolidaysOption}</span>
          </label>

          <label class="ce-radio-option">
            <input type="radio" bind:group={formData.holidayType} value="weekends" />
            <span>{lang.excludeWeekendsOption}</span>
          </label>

          <label class="ce-radio-option">
            <input type="radio" bind:group={formData.holidayType} value="specific" />
            <span>{lang.specificDatesOption}</span>
          </label>
        </div>

        {#if formData.holidayType === "specific"}
          <div class="ce-specific-dates">
            <div class="ce-date-add-row">
              <input type="date" bind:value={formData.tempSpecificDate} class="ce-input" />
              <button type="button" class="ce-btn-add" on:click={addSpecificDate}>{lang.addDate}</button>
            </div>
            {#if formData.specificDates.length > 0}
              <div class="ce-date-chips">
                {#each formData.specificDates as date}
                  <div class="ce-chip">
                    <span>{date}</span>
                    <button type="button" on:click={() => removeSpecificDate(date)}>×</button>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        {/if}
      </div>

      <div class="ce-card ce-config-card">
        <div class="ce-card-head">
          <svg class="ce-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path>
          </svg>
          <span>{lang.rewardsDistribution}</span>
        </div>

        {#each formData.rewards as reward, idx}
          <div class="ce-reward-tier">
            <div class="ce-tier-header">
              <span class="ce-tier-label">{lang.tierLabel} {idx + 1}</span>
              {#if formData.rewards.length > 1}
                <button type="button" class="ce-btn-remove-tier" on:click={() => removeRewardTier(idx)}>×</button>
              {/if}
            </div>
            
            <div class="ce-input-group">
              <label>{lang.rewardNameLabel}</label>
              <input type="text" bind:value={reward.name} placeholder={currentLang === "th" ? "เช่น เสื้อยืด" : "e.g. T-shirt"} class="ce-input" />
            </div>

            <div class="ce-dual-row">
              <div class="ce-input-group">
                <label>{lang.quotaLabel}</label>
                <input type="number" bind:value={reward.quota} placeholder="50" class="ce-input" min="1" />
              </div>

              <div class="ce-input-group">
                <label>{lang.requirementLabel}</label>
                <input type="number" bind:value={reward.requirement} placeholder="10" class="ce-input" min="1" />
              </div>
            </div>
          </div>
        {/each}

        <button type="button" class="ce-btn-add-tier" on:click={addRewardTier}>{lang.addTierBtn}</button>
      </div>

      <div class="ce-card ce-config-card">
        <div class="ce-card-head">
          <svg class="ce-icon-svg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
          </svg>
          <span>{lang.eventStatusTitle}</span>
        </div>

        <div class="ce-toggle-group">
          <label class="ce-toggle-item">
            <span>{lang.publicVisibility}</span>
            <label class="ce-toggle-switch">
              <input type="checkbox" bind:checked={formData.isPublic} />
              <span class="ce-slider"></span>
            </label>
          </label>

          <label class="ce-toggle-item">
            <span>{lang.activeOpen}</span>
            <label class="ce-toggle-switch">
              <input type="checkbox" bind:checked={formData.isActive} />
              <span class="ce-slider"></span>
            </label>
          </label>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  :global(:root) {
    --ce-bg: #0f172a;
    --ce-card-bg: #1e293b;
    --ce-border: rgba(255, 255, 255, 0.08);
    --ce-text: #f8fafc;
    --ce-text-muted: #94a3b8;
    --ce-primary: #10b981;
    --ce-primary-hover: #059669;
    --ce-danger: #ef4444;
    --ce-warning: #f59e0b;
  }

  .ce-wrapper {
    width: 100%;
    height: 100%;
    padding: 2rem 1.5rem;
    background: var(--ce-bg);
    overflow-y: auto;
  }

  .ce-container {
    max-width: 1200px;
    margin: 0 auto;
  }

  .ce-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
    gap: 1rem;
    flex-wrap: wrap;
  }

  .ce-title {
    font-size: 2rem;
    font-weight: 700;
    color: var(--ce-text);
    margin: 0;
  }

  .ce-header-right {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .ce-validation-alert {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid var(--ce-danger);
    border-radius: 10px;
    color: var(--ce-danger);
  }

  .ce-alert-icon {
    width: 20px;
    height: 20px;
  }

  .ce-alert-text {
    font-size: 0.875rem;
    font-weight: 500;
  }

  .ce-header-actions {
    display: flex;
    gap: 0.75rem;
  }

  .ce-btn-cancel, .ce-btn-save {
    padding: 0.75rem 1.5rem;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }

  .ce-btn-cancel {
    background: transparent;
    border: 1px solid var(--ce-border);
    color: var(--ce-text-muted);
  }

  .ce-btn-cancel:hover {
    border-color: var(--ce-danger);
    color: var(--ce-danger);
    background: rgba(239, 68, 68, 0.1);
  }

  .ce-btn-save {
    background: linear-gradient(135deg, var(--ce-primary), var(--ce-primary-hover));
    color: white;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
  }

  .ce-btn-save:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
  }

  .ce-grid-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }

  .ce-card {
    background: var(--ce-card-bg);
    border: 1px solid var(--ce-border);
    border-radius: 20px;
    padding: 1.5rem;
    transition: all 0.3s;
  }

  .ce-card:hover {
    border-color: rgba(16, 185, 129, 0.2);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  }

  .ce-card-head {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid var(--ce-border);
  }

  .ce-icon-svg {
    width: 24px;
    height: 24px;
    color: var(--ce-primary);
  }

  .ce-card-head span {
    font-size: 1.1rem;
    font-weight: 600;
    color: var(--ce-text);
  }

  .ce-img-card {
    position: relative;
    min-height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    overflow: hidden;
  }

  .ce-img-card.has-img {
    padding: 0;
  }

  .ce-preview-img {
    width: 100%;
    height: 300px;
    object-fit: cover;
  }

  .ce-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.3s;
  }

  .ce-img-card:hover .ce-overlay {
    opacity: 1;
  }

  .ce-overlay span {
    color: white;
    font-weight: 600;
    font-size: 1.1rem;
  }

  .ce-upload-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    color: var(--ce-text-muted);
  }

  .ce-icon-upload {
    width: 64px;
    height: 64px;
    background: rgba(16, 185, 129, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ce-icon-upload svg {
    width: 32px;
    height: 32px;
    color: var(--ce-primary);
  }

  .ce-input-group {
    margin-bottom: 1.25rem;
  }

  .ce-input-group:last-child {
    margin-bottom: 0;
  }

  .ce-input-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: var(--ce-text);
    font-size: 0.95rem;
  }

  .ce-req {
    color: var(--ce-danger);
  }

  .ce-input, .ce-textarea, .ce-input-dis {
    width: 100%;
    padding: 0.75rem 1rem;
    background: rgba(15, 23, 42, 0.5);
    border: 1px solid var(--ce-border);
    border-radius: 12px;
    color: var(--ce-text);
    font-size: 0.95rem;
    transition: all 0.2s;
  }

  .ce-input:focus, .ce-textarea:focus {
    outline: none;
    border-color: var(--ce-primary);
    background: rgba(15, 23, 42, 0.7);
  }

  .ce-input.error, .ce-textarea.error, .ce-date-row.error {
    border-color: var(--ce-danger);
  }

  .ce-textarea {
    min-height: 120px;
    resize: vertical;
  }

  .ce-input-dis {
    cursor: pointer;
  }

  .ce-dual-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .ce-event-type-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .ce-event-type-btn {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    padding: 1.25rem;
    background: rgba(15, 23, 42, 0.5);
    border: 2px solid var(--ce-border);
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.3s;
    position: relative;
  }

  .ce-event-type-btn:hover {
    border-color: rgba(16, 185, 129, 0.3);
    background: rgba(16, 185, 129, 0.05);
  }

  .ce-event-type-btn.active {
    border-color: var(--ce-primary);
    background: rgba(16, 185, 129, 0.1);
  }

  .ce-event-type-icon {
    width: 48px;
    height: 48px;
    background: rgba(16, 185, 129, 0.1);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .ce-event-type-icon svg {
    width: 24px;
    height: 24px;
    color: var(--ce-primary);
  }

  .ce-event-type-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .ce-event-type-title {
    font-weight: 600;
    color: var(--ce-text);
    font-size: 1rem;
  }

  .ce-event-type-desc {
    font-size: 0.85rem;
    color: var(--ce-text-muted);
    line-height: 1.4;
  }

  .ce-event-type-check {
    position: absolute;
    top: 1rem;
    right: 1rem;
    width: 24px;
    height: 24px;
    background: var(--ce-primary);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ce-event-type-check svg {
    width: 14px;
    height: 14px;
    color: white;
  }

  .ce-checkin-section {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: rgba(15, 23, 42, 0.5);
    border-radius: 12px;
  }

  .ce-checkin-label {
    font-weight: 500;
    color: var(--ce-text);
  }

  .ce-checkin-stepper {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .ce-stepper-btn {
    width: 36px;
    height: 36px;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .ce-stepper-btn:hover:not(:disabled) {
    background: rgba(16, 185, 129, 0.2);
    border-color: var(--ce-primary);
  }

  .ce-stepper-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .ce-stepper-btn svg {
    width: 20px;
    height: 20px;
    color: var(--ce-primary);
  }

  .ce-stepper-value {
    min-width: 50px;
    text-align: center;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--ce-text);
  }

  .ce-stepper-unit {
    color: var(--ce-text-muted);
    font-size: 0.9rem;
  }

  .ce-date-row {
    display: flex;
    gap: 0.75rem;
  }

  .ce-dd-wrap {
    position: relative;
    flex: 1;
  }

  .ce-dd-wrap.flex-1-5 { flex: 1.5; }
  .ce-dd-wrap.flex-2 { flex: 2; }

  .ce-trigger {
    position: relative;
    cursor: pointer;
  }

  .ce-arrow {
    position: absolute;
    right: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--ce-text-muted);
    font-size: 0.75rem;
    pointer-events: none;
  }

  .ce-options {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    right: 0;
    max-height: 240px;
    overflow-y: auto;
    background: var(--ce-card-bg);
    border: 1px solid var(--ce-border);
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    z-index: 100;
    padding: 0.5rem;
  }

  .ce-options.time-scroll {
    max-height: 300px;
  }

  .ce-opt {
    width: 100%;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    text-align: left;
    color: var(--ce-text);
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s;
    font-size: 0.95rem;
  }

  .ce-opt:hover {
    background: rgba(16, 185, 129, 0.1);
    color: var(--ce-primary);
  }

  .ce-holiday-options {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .ce-radio-option {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: rgba(15, 23, 42, 0.5);
    border: 1px solid var(--ce-border);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .ce-radio-option:hover {
    border-color: rgba(16, 185, 129, 0.3);
    background: rgba(16, 185, 129, 0.05);
  }

  .ce-radio-option input[type="radio"] {
    width: 20px;
    height: 20px;
    accent-color: var(--ce-primary);
    cursor: pointer;
  }

  .ce-radio-option span {
    color: var(--ce-text);
    font-weight: 500;
  }

  .ce-specific-dates {
    margin-top: 1rem;
  }

  .ce-date-add-row {
    display: flex;
    gap: 0.75rem;
  }

  .ce-btn-add {
    padding: 0.75rem 1.5rem;
    background: var(--ce-primary);
    border: none;
    border-radius: 12px;
    color: white;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
  }

  .ce-btn-add:hover {
    background: var(--ce-primary-hover);
  }

  .ce-date-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .ce-chip {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 20px;
    color: var(--ce-primary);
    font-size: 0.9rem;
  }

  .ce-chip button {
    width: 20px;
    height: 20px;
    background: rgba(239, 68, 68, 0.1);
    border: none;
    border-radius: 50%;
    color: var(--ce-danger);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    line-height: 1;
  }

  .ce-reward-tier {
    padding: 1.25rem;
    background: rgba(15, 23, 42, 0.5);
    border: 1px solid var(--ce-border);
    border-radius: 12px;
    margin-bottom: 1rem;
  }

  .ce-tier-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .ce-tier-label {
    font-weight: 600;
    color: var(--ce-primary);
  }

  .ce-btn-remove-tier {
    width: 28px;
    height: 28px;
    background: rgba(239, 68, 68, 0.1);
    border: none;
    border-radius: 50%;
    color: var(--ce-danger);
    font-size: 1.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    line-height: 1;
  }

  .ce-btn-add-tier {
    width: 100%;
    padding: 1rem;
    background: rgba(16, 185, 129, 0.1);
    border: 2px dashed rgba(16, 185, 129, 0.3);
    border-radius: 12px;
    color: var(--ce-primary);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .ce-btn-add-tier:hover {
    background: rgba(16, 185, 129, 0.2);
    border-color: var(--ce-primary);
  }

  .ce-toggle-group {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .ce-toggle-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    background: rgba(15, 23, 42, 0.5);
    border-radius: 12px;
  }

  .ce-toggle-item > span {
    font-weight: 500;
    color: var(--ce-text);
  }

  .ce-toggle-switch {
    position: relative;
    display: inline-block;
    width: 52px;
    height: 28px;
  }

  .ce-toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }

  .ce-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(255, 255, 255, 0.1);
    transition: 0.4s;
    border-radius: 34px;
  }

  .ce-slider:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: 0.4s;
    border-radius: 50%;
  }

  input:checked + .ce-slider {
    background-color: var(--ce-primary);
  }

  input:checked + .ce-slider:before {
    transform: translateX(24px);
  }

  @media (max-width: 768px) {
    .ce-wrapper {
      padding: 1rem;
    }

    .ce-title {
      font-size: 1.5rem;
    }

    .ce-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .ce-header-right {
      width: 100%;
      flex-direction: column;
    }

    .ce-header-actions {
      width: 100%;
    }

    .ce-btn-cancel, .ce-btn-save {
      flex: 1;
    }

    .ce-event-type-buttons {
      grid-template-columns: 1fr;
    }

    .ce-dual-row {
      grid-template-columns: 1fr;
    }

    .ce-date-row {
      flex-direction: column;
    }
  }
</style>