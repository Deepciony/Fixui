<script lang="ts">
  import { appState } from '../../_lib/stores/appState';
  // ✅ Import ข้อมูลวันหยุด
  import holidaysData from '$lib/data/holidays.json';
  
  // ✅ เพิ่ม holidayType ใหม่
  export let holidayType: 'none' | 'weekends' | 'specific' | 'public' | 'weekends_public';
  export let holidays: string[] = [];
  
  // ✅ รับช่วงเวลาเพื่อคำนวณวันหยุดอัตโนมัติ
  export let startDate: string = "";
  export let endDate: string = "";
  
  $: lang = $appState.currentLang;
  
  let selectedDate = '';

  // ฟังก์ชันคำนวณวันหยุดตามประเภทที่เลือก
  function applyHolidayPreset(type: typeof holidayType) {
    if (!startDate || !endDate) return;

    const start = new Date(startDate);
    const end = new Date(endDate);
    let newHolidays: string[] = [];

    const inRange = (d: string) => {
        const target = new Date(d);
        return target >= start && target <= end;
    };

    // 1. วันหยุดนักขัตฤกษ์
    if (type === 'public' || type === 'weekends_public') {
        const publicHolidays = holidaysData
            .filter(h => inRange(h.date))
            .map(h => h.date);
        newHolidays = [...newHolidays, ...publicHolidays];
    }

    // 2. วันเสาร์-อาทิตย์
    if (type === 'weekends' || type === 'weekends_public') {
        const current = new Date(start);
        while (current <= end) {
            const day = current.getDay();
            if (day === 0 || day === 6) { // 0=อาทิตย์, 6=เสาร์
                const y = current.getFullYear();
                const m = String(current.getMonth() + 1).padStart(2, '0');
                const d = String(current.getDate()).padStart(2, '0');
                const dateStr = `${y}-${m}-${d}`;
                if (!newHolidays.includes(dateStr)) {
                    newHolidays.push(dateStr);
                }
            }
            current.setDate(current.getDate() + 1);
        }
    }

    // อัปเดตรายการวันหยุด (เฉพาะถ้าไม่ใช่โหมดเลือกเอง)
    if (type !== 'specific' && type !== 'none') {
        holidays = newHolidays.sort();
    } else if (type === 'none') {
        holidays = [];
    }
  }

  function handleTypeChange(type: typeof holidayType) {
    holidayType = type;
    if (type !== 'specific') {
        applyHolidayPreset(type);
    }
  }

  function addHoliday() {
    if (selectedDate && !holidays.includes(selectedDate)) {
      holidays = [...holidays, selectedDate].sort();
      selectedDate = '';
    }
  }
  
  function removeHoliday(date: string) {
    holidays = holidays.filter(d => d !== date);
  }
  
  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString(lang === 'th' ? 'th-TH' : 'en-US', {
      day: '2-digit', month: 'short', year: 'numeric'
    });
  }
  
  // ✅ Helper หาชื่อวันหยุด
  function getHolidayDisplayName(dateStr: string): string {
      const h = holidaysData.find(x => x.date === dateStr);
      if (h) return lang === 'th' ? h.name_th : h.name;
      
      const d = new Date(dateStr).getDay();
      if (d === 0) return lang === 'th' ? 'วันอาทิตย์' : 'Sunday';
      if (d === 6) return lang === 'th' ? 'วันเสาร์' : 'Saturday';
      
      return formatDate(dateStr);
  }
</script>

<div class="holiday-selector">
  <h4 class="title">{lang === 'th' ? 'การกำหนดวันหยุด' : 'Holiday Settings'}</h4>
  
  <div class="options">
    <label class="option" class:selected={holidayType === 'none'}>
      <input type="radio" name="hType" checked={holidayType === 'none'} on:change={() => handleTypeChange('none')} hidden />
      <span>{lang === 'th' ? 'ไม่มีวันหยุด' : 'No holidays'}</span>
    </label>
    
    <label class="option" class:selected={holidayType === 'weekends'}>
      <input type="radio" name="hType" checked={holidayType === 'weekends'} on:change={() => handleTypeChange('weekends')} hidden />
      <span>{lang === 'th' ? 'หยุดเสาร์-อาทิตย์' : 'Exclude Weekends'}</span>
    </label>

    <label class="option" class:selected={holidayType === 'public'}>
      <input type="radio" name="hType" checked={holidayType === 'public'} on:change={() => handleTypeChange('public')} hidden />
      <span>{lang === 'th' ? 'หยุดวันนักขัตฤกษ์' : 'Public Holidays Only'}</span>
    </label>

    <label class="option" class:selected={holidayType === 'weekends_public'}>
      <input type="radio" name="hType" checked={holidayType === 'weekends_public'} on:change={() => handleTypeChange('weekends_public')} hidden />
      <span>{lang === 'th' ? 'หยุดเสาร์-อาทิตย์ + นักขัตฤกษ์' : 'Weekends & Public Holidays'}</span>
    </label>
    
    <label class="option" class:selected={holidayType === 'specific'}>
      <input type="radio" name="hType" checked={holidayType === 'specific'} on:change={() => handleTypeChange('specific')} hidden />
      <span>{lang === 'th' ? 'เลือกวันเอง' : 'Specific Dates'}</span>
    </label>
  </div>
  
  {#if holidayType !== 'none'}
    <div class="date-selection">
      {#if holidayType === 'specific'}
        <div class="input-group">
            <input type="date" class="date-input" bind:value={selectedDate} min={startDate} max={endDate} />
            <button class="btn-add" on:click={addHoliday} type="button">
            {lang === 'th' ? 'เพิ่ม' : 'Add'}
            </button>
        </div>
      {/if}
      
      {#if holidays.length > 0}
        <div class="holiday-list">
          <h5 class="list-title">
            {lang === 'th' ? 'รายการวันหยุด' : 'Selected Holidays'} ({holidays.length})
          </h5>
          <div class="holiday-tags">
            {#each holidays as date}
              <div class="holiday-tag" class:auto-generated={holidayType !== 'specific'}>
                <span><strong>{getHolidayDisplayName(date)}</strong> <small>({formatDate(date)})</small></span>
                {#if holidayType === 'specific'}
                    <button on:click={() => removeHoliday(date)} type="button">×</button>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {:else if holidayType !== 'specific'}
         <p class="text-sm text-gray-500 mt-2">
            {lang === 'th' ? '* ไม่มีวันหยุดในช่วงเวลาที่เลือก' : '* No holidays in selected range'}
         </p>
      {/if}
    </div>
  {/if}
</div>

<style>
  .holiday-selector { display: flex; flex-direction: column; gap: 1rem; }
  .title { font-size: 0.95rem; font-weight: 600; color: var(--text); margin: 0; }
  .options { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
  .option { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem; border: 1px solid var(--border); border-radius: 8px; cursor: pointer; transition: all 0.2s; background: rgba(15, 23, 42, 0.3); }
  .option:hover { border-color: var(--primary); background: rgba(16, 185, 129, 0.05); }
  .option.selected { border-color: var(--primary); background: rgba(16, 185, 129, 0.15); color: var(--primary); font-weight: 500; }
  .date-selection { padding: 1rem; background: rgba(15, 23, 42, 0.3); border-radius: 8px; border: 1px solid var(--border); margin-top: 0.5rem; }
  .input-group { display: flex; gap: 0.5rem; margin-bottom: 1rem; }
  .date-input { flex: 1; padding: 0.5rem; background: #0f172a; border: 1px solid var(--border); border-radius: 8px; color: white; }
  .btn-add { padding: 0 1rem; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer; }
  .holiday-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; }
  .holiday-tag { display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0.8rem; background: rgba(15, 23, 42, 0.6); border: 1px solid var(--border); border-radius: 6px; font-size: 0.85rem; color: #cbd5e1; }
  .holiday-tag.auto-generated { border-color: rgba(16, 185, 129, 0.3); color: #6ee7b7; }
  .holiday-tag button { background: none; border: none; color: #ef4444; cursor: pointer; font-size: 1.1rem; line-height: 1; margin-left: 4px; }
  
  @media (max-width: 640px) { .options { grid-template-columns: 1fr; } }
</style>