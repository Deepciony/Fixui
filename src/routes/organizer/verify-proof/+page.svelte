<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import axios from 'axios';
  import Swal from 'sweetalert2';
  
  // API Configuration
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
  
  // Language
  type Language = "th" | "en";
  let currentLang: Language = "th";
  
  if (typeof localStorage !== "undefined") {
    const saved = localStorage.getItem("app_language");
    if (saved === "th" || saved === "en") currentLang = saved;
  }
  
  const translations = {
    th: {
      noEventsFound: "ไม่พบกิจกรรม",
      verifySubmissions: "ตรวจสอบการส่ง",
      backToEvents: "กลับไปหน้ากิจกรรม",
      pending: "รอการตรวจสอบ",
      approved: "อนุมัติแล้ว",
      rejected: "ปฏิเสธแล้ว",
      all: "ทั้งหมด",
      apply: "ใช้งาน",
      reset: "รีเซ็ต",
      approve: "อนุมัติ",
      reject: "ปฏิเสธ",
      noPendingSubmissions: "ไม่มีการส่งที่รอตรวจสอบ",
      loadingSubmissions: "กำลังโหลดข้อมูล...",
      searchPlaceholder: "ค้นหาด้วยชื่อ, อีเมล หรือ รหัสนิสิต...",
      batch: "รุ่น",
      stdId: "รหัสนิสิต",
      from: "จาก",
      to: "ถึง",
      selectDate: "เลือกวันที่",
      confirmApprove: "ยืนยันการอนุมัติ",
      confirmReject: "ยืนยันการปฏิเสธ",
      approveSuccess: "อนุมัติสำเร็จ",
      rejectSuccess: "ปฏิเสธสำเร็จ",
      error: "เกิดข้อผิดพลาด",
    },
    en: {
      noEventsFound: "No events found",
      verifySubmissions: "Verify Submissions",
      backToEvents: "Back to Events",
      pending: "Pending",
      approved: "Approved",
      rejected: "Rejected",
      all: "All",
      apply: "Apply",
      reset: "Reset",
      approve: "Approve",
      reject: "Reject",
      noPendingSubmissions: "No pending submissions",
      loadingSubmissions: "Loading submissions...",
      searchPlaceholder: "Search by name, email, or Nisit ID...",
      batch: "Batch",
      stdId: "Std ID",
      from: "From",
      to: "To",
      selectDate: "Select date",
      confirmApprove: "Confirm approval",
      confirmReject: "Confirm rejection",
      approveSuccess: "Approved successfully",
      rejectSuccess: "Rejected successfully",
      error: "Error occurred",
    },
  };
  
  $: lang = translations[currentLang];
  
  // Types
  interface Event {
    id: string;
    title: string;
    description: string;
    location: string;
    startDate: string;
    endDate: string;
    startTime: string;
    endTime: string;
    status: "Active" | "Closed" | "Draft";
    image: string;
    pendingCount?: number;
  }
  
  interface Submission {
    id: string;
    runnerName: string;
    odySd: string;
    email: string;
    proofImage: string;
    status: "Pending" | "Approved" | "Rejected";
    submittedAt: string;
  }
  
  // State
  let events: Event[] = [];
  let selectedEvent: Event | null = null;
  let submissions: Submission[] = [];
  let loading = false;
  
  // Event Selection
  let eventsPage = 1;
  const eventsPerPage = 9;
  let showEventsPageDropdown = false;
  
  // Filters
  let searchQuery = "";
  let batchFilter = "";
  let stdIdFilter = "";
  let statusFilter = "All";
  let fromDate = "";
  let toDate = "";
  
  // Filter dropdowns
  let showStatusDropdown = false;
  let showFromDateDropdown = false;
  let showToDateDropdown = false;
  
  // Submissions pagination
  let submissionsPage = 1;
  const submissionsPerPage = 12;
  let showSubmissionsPageDropdown = false;
  
  // Auto-refresh
  let autoRefreshEnabled = false;
  let autoRefreshInterval: any;
  let isConnected = false;
  let newSubmissionsCount = 0;
  
  // Image modal
  let showImageModal = false;
  let modalImageUrl = "";
  
  // Available dates for filtering
  let availableDates: { value: string; display: string }[] = [];
  
  // Computed
  $: paginatedEvents = events.slice((eventsPage - 1) * eventsPerPage, eventsPage * eventsPerPage);
  $: totalEventsPages = Math.ceil(events.length / eventsPerPage);
  
  $: filteredSubmissions = submissions.filter(sub => {
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = sub.runnerName.toLowerCase().includes(q) ||
                    sub.email.toLowerCase().includes(q) ||
                    sub.odySd.toLowerCase().includes(q);
      if (!match) return false;
    }
    
    // Batch filter
    if (batchFilter && batchFilter.length === 2) {
      if (!sub.odySd.startsWith(batchFilter)) return false;
    }
    
    // Std ID filter
    if (stdIdFilter && stdIdFilter.length > 0) {
      const stdPart = sub.odySd.substring(2, 8);
      if (!stdPart.includes(stdIdFilter)) return false;
    }
    
    // Status filter
    if (statusFilter !== "All" && sub.status !== statusFilter) return false;
    
    // Date filter
    if (fromDate || toDate) {
      const subDate = new Date(sub.submittedAt).toISOString().split('T')[0];
      if (fromDate && subDate < fromDate) return false;
      if (toDate && subDate > toDate) return false;
    }
    
    return true;
  });
  
  $: sortedSubmissions = [...filteredSubmissions].sort((a, b) => {
    return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
  });
  
  $: paginatedSubmissions = sortedSubmissions.slice(
    (submissionsPage - 1) * submissionsPerPage,
    submissionsPage * submissionsPerPage
  );
  
  $: totalSubmissionsPages = Math.ceil(sortedSubmissions.length / submissionsPerPage);
  $: totalSubmissions = sortedSubmissions.length;
  
  // Functions
  function formatDateRange(event: Event, lang: Language): string {
    const start = new Date(event.startDate);
    const end = new Date(event.endDate);
    const locale = lang === "th" ? "th-TH" : "en-GB";
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    
    if (start.toDateString() === end.toDateString()) {
      return start.toLocaleDateString(locale, options);
    }
    return `${start.toLocaleDateString(locale, options)} - ${end.toLocaleDateString(locale, options)}`;
  }
  
  function translateStatus(status: string): string {
    const map: any = {
      Active: currentLang === "th" ? "เปิดใช้งาน" : "Active",
      Closed: currentLang === "th" ? "ปิดแล้ว" : "Closed",
      Draft: currentLang === "th" ? "แบบร่าง" : "Draft",
    };
    return map[status] || status;
  }
  
  async function loadEvents() {
    loading = true;
    try {
      const response = await api.get('/api/events');
      events = response.data.map((e: any) => ({
        ...e,
        pendingCount: e.pending_proof_count || 0
      }));
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      loading = false;
    }
  }
  
  async function selectEvent(event: Event) {
    selectedEvent = event;
    await loadSubmissions(event.id);
  }
  
  async function loadSubmissions(eventId: string) {
    loading = true;
    try {
      const response = await api.get(`/api/events/${eventId}/proof-submissions`);
      submissions = response.data;
      
      // Extract available dates
      const dates = [...new Set(submissions.map(s => s.submittedAt.split('T')[0]))];
      availableDates = dates.sort().reverse().map(d => ({
        value: d,
        display: new Date(d).toLocaleDateString(currentLang === "th" ? "th-TH" : "en-GB", {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        })
      }));
    } catch (error) {
      console.error('Failed to load submissions:', error);
    } finally {
      loading = false;
    }
  }
  
  function backToEventsList() {
    selectedEvent = null;
    submissions = [];
    resetFilters();
  }
  
  function resetFilters() {
    searchQuery = "";
    batchFilter = "";
    stdIdFilter = "";
    statusFilter = "All";
    fromDate = "";
    toDate = "";
    submissionsPage = 1;
  }
  
  async function onApproveSubmission(sub: Submission) {
    const result = await Swal.fire({
      title: lang.confirmApprove,
      text: `${sub.runnerName} (${sub.odySd})`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: lang.approve,
      cancelButtonText: lang.reject,
      background: '#1e293b',
      color: '#fff',
    });
    
    if (result.isConfirmed) {
      try {
        await api.post(`/api/proof-submissions/${sub.id}/approve`);
        
        await Swal.fire({
          title: lang.approveSuccess,
          icon: 'success',
          background: '#1e293b',
          color: '#fff',
          confirmButtonColor: '#10b981',
          timer: 1500,
          showConfirmButton: false
        });
        
        // Reload submissions
        if (selectedEvent) {
          await loadSubmissions(selectedEvent.id);
        }
      } catch (error) {
        Swal.fire({
          title: lang.error,
          text: 'Failed to approve submission',
          icon: 'error',
          background: '#1e293b',
          color: '#fff',
          confirmButtonColor: '#10b981'
        });
      }
    }
  }
  
  async function onRejectSubmission(sub: Submission) {
    const result = await Swal.fire({
      title: lang.confirmReject,
      text: `${sub.runnerName} (${sub.odySd})`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: lang.reject,
      cancelButtonText: lang.apply,
      background: '#1e293b',
      color: '#fff',
    });
    
    if (result.isConfirmed) {
      try {
        await api.post(`/api/proof-submissions/${sub.id}/reject`);
        
        await Swal.fire({
          title: lang.rejectSuccess,
          icon: 'success',
          background: '#1e293b',
          color: '#fff',
          confirmButtonColor: '#10b981',
          timer: 1500,
          showConfirmButton: false
        });
        
        // Reload submissions
        if (selectedEvent) {
          await loadSubmissions(selectedEvent.id);
        }
      } catch (error) {
        Swal.fire({
          title: lang.error,
          text: 'Failed to reject submission',
          icon: 'error',
          background: '#1e293b',
          color: '#fff',
          confirmButtonColor: '#10b981'
        });
      }
    }
  }
  
  function onProofImageClick(imageUrl: string) {
    modalImageUrl = imageUrl;
    showImageModal = true;
  }
  
  function closeImageModal() {
    showImageModal = false;
    modalImageUrl = "";
  }
  
  function toggleAutoRefresh() {
    autoRefreshEnabled = !autoRefreshEnabled;
    
    if (autoRefreshEnabled) {
      isConnected = true;
      autoRefreshInterval = setInterval(async () => {
        if (selectedEvent) {
          const oldCount = submissions.length;
          await loadSubmissions(selectedEvent.id);
          const newCount = submissions.length;
          if (newCount > oldCount) {
            newSubmissionsCount = newCount - oldCount;
          }
        }
      }, 5000); // Refresh every 5 seconds
    } else {
      isConnected = false;
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
      }
    }
  }
  
  async function refreshSubmissions() {
    if (selectedEvent) {
      await loadSubmissions(selectedEvent.id);
      newSubmissionsCount = 0;
    }
  }
  
  // Pagination
  function prevEventsPage() {
    if (eventsPage > 1) eventsPage--;
  }
  
  function nextEventsPage() {
    if (eventsPage < totalEventsPages) eventsPage++;
  }
  
  function prevSubmissionsPage() {
    if (submissionsPage > 1) submissionsPage--;
  }
  
  function nextSubmissionsPage() {
    if (submissionsPage < totalSubmissionsPages) submissionsPage++;
  }
  
  onMount(() => {
    loadEvents();
  });
  
  onDestroy(() => {
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
    }
  });
</script>

<svelte:window on:click={() => {
  showEventsPageDropdown = false;
  showSubmissionsPageDropdown = false;
  showStatusDropdown = false;
  showFromDateDropdown = false;
  showToDateDropdown = false;
}} />

<div class="logs-container">
  {#if !selectedEvent}
    <!-- EVENT SELECTION GRID -->
    <div class="grid-section">
      {#if paginatedEvents.length === 0}
        <div class="empty-state">
          <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <p>{lang.noEventsFound}</p>
        </div>
      {:else}
        <div class="grid">
          {#each paginatedEvents as event (event.id)}
            <div class="glass-card">
              <div class="card-img-wrapper">
                <img src={event.image || "https://placehold.co/400x200/1e293b/64748b?text=No+Image"} alt={event.title} class="card-img" loading="lazy" on:error={(e) => { e.currentTarget.src = "https://placehold.co/400x200/1e293b/64748b?text=Image+Unavailable"; }} />
                {#if event.pendingCount && event.pendingCount > 0}
                  <div class="pending-badge-overlay">{event.pendingCount} Pending</div>
                {/if}
              </div>
              <div class="card-body">
                <div class="card-header">
                  <h3>{event.title}</h3>
                  <div class="status-group">
                    <span class="status-badge" class:status-active={event.status === "Active"} class:status-closed={event.status === "Closed"} class:status-draft={event.status === "Draft"}>{translateStatus(event.status)}</span>
                  </div>
                </div>
                {#if event.description}
                  <p class="event-description-short">{event.description.substring(0, 80)}{event.description.length > 80 ? "..." : ""}</p>
                {/if}
                <div class="event-simple-meta">
                  <div class="meta-row">
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    <span>{event.location}</span>
                  </div>
                  <div class="meta-row">
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                    </svg>
                    <span>{formatDateRange(event, currentLang)}</span>
                  </div>
                  {#if event.startTime && event.endTime}
                    <div class="meta-row">
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      <span>{event.startTime} - {event.endTime}</span>
                    </div>
                  {/if}
                </div>

                <div class="action-buttons">
                  <button class="action-btn btn-view" on:click={() => selectEvent(event)}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    {lang.verifySubmissions}
                  </button>
                </div>
              </div>
            </div>
          {/each}
        </div>

        {#if totalEventsPages > 1}
          <div class="pagination-wrapper">
            <div class="pagination-controls">
              <button class="page-btn" on:click={prevEventsPage} disabled={eventsPage === 1}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
              </button>
              
              <div class="page-select-wrapper">
                <button class="page-indicator-box clickable" on:click|stopPropagation={() => (showEventsPageDropdown = !showEventsPageDropdown)}>
                  <span class="current-page">{eventsPage}</span>
                  <span class="sep">/</span>
                  <span class="total-page">{totalEventsPages}</span>
                  <svg class="dropdown-arrow" class:flipped={showEventsPageDropdown} width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"></path></svg>
                </button>
                {#if showEventsPageDropdown}
                  <div class="page-dropdown-list" on:click|stopPropagation>
                    {#each Array(totalEventsPages) as _, i}
                      <button class="page-dropdown-item" class:active={eventsPage === i + 1} on:click={() => { eventsPage = i + 1; showEventsPageDropdown = false; }}>Page {i + 1}</button>
                    {/each}
                  </div>
                {/if}
              </div>
              
              <button class="page-btn" on:click={nextEventsPage} disabled={eventsPage === totalEventsPages}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
              </button>
            </div>
          </div>
        {/if}
      {/if}
    </div>
  {:else}
    <!-- SUBMISSIONS DETAIL VIEW -->
    <div class="logs-detail">
      <!-- Header -->
      <div class="logs-header">
        <button class="btn-back-logs" on:click={backToEventsList}>
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
          {lang.backToEvents}
        </button>
        
        <div class="selected-event-info">
          <h3>{selectedEvent.title}</h3>
          <div class="event-meta-small">
            <span>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
              {selectedEvent.location}
            </span>
            <span>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
              {formatDateRange(selectedEvent, currentLang)}
            </span>
            {#if selectedEvent.startTime && selectedEvent.endTime}
              <span>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                {selectedEvent.startTime} - {selectedEvent.endTime}
              </span>
            {/if}
            <span class="status-badge-inline" class:active={selectedEvent.status === "Active"}>{selectedEvent.status}</span>
          </div>
        </div>
        
        <div class="logs-action-buttons">
          <div class="realtime-controls">
            {#if newSubmissionsCount > 0}
              <button class="btn-new-logs" on:click={refreshSubmissions}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                {newSubmissionsCount} New
              </button>
            {/if}
            <button class="btn-auto-refresh" class:active={autoRefreshEnabled} on:click={toggleAutoRefresh} title={autoRefreshEnabled ? "Auto-refresh ON" : "Auto-refresh OFF"}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              {#if isConnected}<span class="live-dot"></span>{/if}
            </button>
          </div>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-dashboard-single-row">
        <div class="stat-card-compact pending">
          <div class="stat-icon-compact">
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div class="stat-info-compact">
            <div class="stat-value-compact">{submissions.length}</div>
            <div class="stat-label-compact">Pending</div>
          </div>
        </div>
      </div>

ENDFILE

echo "Part 1 created, continuing..."

      <!-- Filters -->
      <div class="filter-section-logs">
        <!-- Row 1: Search + Batch + Std ID -->
        <div class="filter-row-logs">
          <div class="search-box-logs">
            <svg class="search-icon" width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
            <input type="text" placeholder={lang.searchPlaceholder} bind:value={searchQuery} />
          </div>
          <div class="nisit-filter-box">
            <input type="text" placeholder={lang.batch} maxlength="2" bind:value={batchFilter} on:input={(e) => { batchFilter = e.currentTarget.value.replace(/\D/g, ""); }} />
          </div>
          <div class="nisit-filter-box">
            <input type="text" placeholder={lang.stdId} maxlength="6" bind:value={stdIdFilter} on:input={(e) => { stdIdFilter = e.currentTarget.value.replace(/\D/g, ""); }} />
          </div>
        </div>

        <!-- Row 2: Status + Date Range + Buttons -->
        <div class="filter-row-logs">
          <!-- Status Filter -->
          <div class="filter-dropdown-logs" class:dropdown-open={showStatusDropdown}>
            <button class="filter-trigger-logs" on:click|stopPropagation={() => { showFromDateDropdown = false; showToDateDropdown = false; showStatusDropdown = !showStatusDropdown; }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
              </svg>
              <span>{statusFilter || lang.all}</span>
              <svg class="chevron" class:rotated={showStatusDropdown} width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            {#if showStatusDropdown}
              <div class="filter-menu-logs" on:click|stopPropagation>
                <button class="filter-option-logs" class:selected={statusFilter === "All"} on:click={() => { statusFilter = "All"; showStatusDropdown = false; }}>{lang.all}</button>
                <button class="filter-option-logs" class:selected={statusFilter === "Pending"} on:click={() => { statusFilter = "Pending"; showStatusDropdown = false; }}>{lang.pending}</button>
              </div>
            {/if}
          </div>

          <!-- From Date -->
          <div class="date-input-group-logs" class:dropdown-open={showFromDateDropdown}>
            <label>{lang.from}:</label>
            <div class="custom-date-dropdown-logs">
              <button class="custom-date-trigger-logs" on:click|stopPropagation={() => { showStatusDropdown = false; showToDateDropdown = false; showFromDateDropdown = !showFromDateDropdown; }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                <span>{fromDate ? availableDates.find(d => d.value === fromDate)?.display || fromDate : lang.selectDate}</span>
                <svg class="chevron" class:rotated={showFromDateDropdown} width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
              {#if showFromDateDropdown}
                <div class="custom-date-menu-logs" on:click|stopPropagation>
                  {#each availableDates as date}
                    <button class="date-option-logs" class:selected={fromDate === date.value} on:click={() => { fromDate = date.value; showFromDateDropdown = false; }}>{date.display}</button>
                  {/each}
                </div>
              {/if}
            </div>
          </div>

          <!-- To Date -->
          <div class="date-input-group-logs" class:dropdown-open={showToDateDropdown}>
            <label>{lang.to}:</label>
            <div class="custom-date-dropdown-logs">
              <button class="custom-date-trigger-logs" on:click|stopPropagation={() => { showStatusDropdown = false; showFromDateDropdown = false; showToDateDropdown = !showToDateDropdown; }}>
                <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                <span>{toDate ? availableDates.find(d => d.value === toDate)?.display || toDate : lang.selectDate}</span>
                <svg class="chevron" class:rotated={showToDateDropdown} width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
              {#if showToDateDropdown}
                <div class="custom-date-menu-logs" on:click|stopPropagation>
                  {#each availableDates as date}
                    <button class="date-option-logs" class:selected={toDate === date.value} on:click={() => { toDate = date.value; showToDateDropdown = false; }}>{date.display}</button>
                  {/each}
                </div>
              {/if}
            </div>
          </div>

          <!-- Apply & Reset Buttons -->
          <button class="btn-apply-logs" on:click={() => { submissionsPage = 1; }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path></svg>
            {lang.apply}
          </button>

          <button class="btn-reset-logs" on:click={resetFilters}>
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            {lang.reset}
          </button>
        </div>
      </div>

      <!-- Submissions Grid -->
      <div class="verify-proof-submissions-section">
        {#if loading}
          <div class="loading-state">
            <div class="spinner"></div>
            <span>{lang.loadingSubmissions}</span>
          </div>
        {:else if sortedSubmissions.length === 0}
          <div class="empty-state">
            <svg width="64" height="64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p>{lang.noPendingSubmissions}</p>
          </div>
        {:else}
          <div class="submissions-grid-new">
            {#each paginatedSubmissions as sub, index (sub.id)}
              {@const globalIndex = (submissionsPage - 1) * submissionsPerPage + index}
              <div class="proof-card">
                <div class="rank-circle">#{globalIndex + 1}</div>
                <div class="user-details">
                  <h4 class="user-name">{sub.runnerName}</h4>
                  <p class="user-meta">
                    <span class="nisit-id">{sub.odySd}</span>
                    <span class="separator">•</span>
                    <span class="user-email">{sub.email}</span>
                  </p>
                  <p class="status-text">Pending Verification</p>
                </div>
                <div class="proof-image-box" role="button" tabindex="0" on:click={() => onProofImageClick(sub.proofImage)} on:keydown={(e) => { if (e.key === "Enter" || e.key === " ") onProofImageClick(sub.proofImage); }}>
                  {#if sub.proofImage}
                    <img src={sub.proofImage} alt="Proof" />
                    <div class="image-overlay">
                      <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path d="M21 21l-4.35-4.35"></path><path d="M11 8v6M8 11h6"></path><circle cx="11" cy="11" r="8"></circle></svg>
                      <span>Click to view</span>
                    </div>
                  {:else}
                    <div class="no-image-placeholder">No image</div>
                  {/if}
                </div>
                <div class="proof-card-actions">
                  <button class="btn-reject" on:click={() => onRejectSubmission(sub)}>{lang.reject}</button>
                  <button class="btn-approve" on:click={() => onApproveSubmission(sub)}>{lang.approve}</button>
                </div>
              </div>
            {/each}
          </div>

          {#if totalSubmissionsPages > 1}
            <div class="pagination-wrapper">
              <div class="pagination-controls">
                <button class="page-btn" on:click={prevSubmissionsPage} disabled={submissionsPage === 1}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 19l-7-7 7-7" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>

                <div class="page-select-wrapper">
                  <button class="page-indicator-box clickable" on:click|stopPropagation={() => (showSubmissionsPageDropdown = !showSubmissionsPageDropdown)}>
                    <span class="current-page">{submissionsPage}</span>
                    <span class="sep">/</span>
                    <span class="total-page">{totalSubmissionsPages}</span>
                    <svg class="dropdown-arrow" class:flipped={showSubmissionsPageDropdown} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>

                  {#if showSubmissionsPageDropdown}
                    <div class="page-dropdown-list" on:click|stopPropagation>
                      {#each Array(totalSubmissionsPages) as _, i}
                        <button class="page-dropdown-item" class:active={submissionsPage === i + 1} on:click={() => { submissionsPage = i + 1; showSubmissionsPageDropdown = false; }}>Page {i + 1}</button>
                      {/each}
                    </div>
                  {/if}
                </div>

                <button class="page-btn" on:click={nextSubmissionsPage} disabled={submissionsPage === totalSubmissionsPages}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7" stroke-linecap="round" stroke-linejoin="round"/></svg>
                </button>
              </div>
            </div>
            
            <div class="page-info">
              Showing {(submissionsPage - 1) * submissionsPerPage + 1} - {Math.min(submissionsPage * submissionsPerPage, totalSubmissions)} of {totalSubmissions} submissions
            </div>
          {/if}
        {/if}
      </div>
    </div>
  {/if}
</div>

<!-- Image Modal -->
{#if showImageModal}
  <div class="image-modal" on:click={closeImageModal}>
    <div class="modal-content" on:click|stopPropagation>
      <button class="modal-close" on:click={closeImageModal}>×</button>
      <img src={modalImageUrl} alt="Proof Full View" />
    </div>
  </div>
{/if}


<style>
  /* CONTAINER */
  .logs-container {
    padding: 2rem 1.5rem;
    min-height: 100vh;
  }

  /* GRID SECTION (Event Selection) */
  .grid-section {
    max-width: 1400px;
    margin: 0 auto;
  }

  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .glass-card {
    background: rgba(30, 41, 59, 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    overflow: hidden;
    transition: all 0.3s;
    display: flex;
    flex-direction: column;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
  }

  .glass-card:hover {
    transform: translateY(-4px);
    border-color: rgba(16, 185, 129, 0.3);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  }

  .card-img-wrapper {
    position: relative;
    width: 100%;
    height: 200px;
    overflow: hidden;
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  }

  .card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s;
  }

  .glass-card:hover .card-img {
    transform: scale(1.05);
  }

  .pending-badge-overlay {
    position: absolute;
    top: 1rem;
    right: 1rem;
    padding: 0.5rem 1rem;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    border-radius: 20px;
    color: white;
    font-size: 0.875rem;
    font-weight: 700;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.4);
  }

  .card-body {
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    flex: 1;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .card-header h3 {
    flex: 1;
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #f8fafc;
    line-height: 1.4;
  }

  .status-group {
    display: flex;
    gap: 0.5rem;
  }

  .status-badge {
    padding: 0.375rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .status-badge.status-active {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .status-badge.status-closed {
    background: rgba(239, 68, 68, 0.15);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .status-badge.status-draft {
    background: rgba(148, 163, 184, 0.15);
    color: #94a3b8;
    border: 1px solid rgba(148, 163, 184, 0.3);
  }

  .event-description-short {
    color: #94a3b8;
    font-size: 0.875rem;
    line-height: 1.5;
    margin: 0;
  }

  .event-simple-meta {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .meta-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #64748b;
    font-size: 0.875rem;
  }

  .meta-row svg {
    flex-shrink: 0;
    color: #10b981;
  }

  .action-buttons {
    display: flex;
    gap: 0.75rem;
    margin-top: auto;
  }

  .action-btn {
    flex: 1;
    padding: 0.75rem 1rem;
    background: transparent;
    border: 1px solid rgba(16, 185, 129, 0.4);
    border-radius: 12px;
    color: #10b981;
    font-weight: 600;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.3s;
  }

  .action-btn:hover {
    background: rgba(16, 185, 129, 0.1);
    border-color: #10b981;
    transform: translateY(-2px);
  }

  /* PAGINATION */
  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin: 2rem 0 1rem;
  }

  .pagination-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .page-btn {
    width: 40px;
    height: 40px;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s;
    color: #94a3b8;
  }

  .page-btn:hover:not(:disabled) {
    background: rgba(16, 185, 129, 0.1);
    border-color: rgba(16, 185, 129, 0.3);
    color: #10b981;
  }

  .page-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .page-select-wrapper {
    position: relative;
  }

  .page-indicator-box {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.625rem 1rem;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    color: #f8fafc;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
  }

  .page-indicator-box:hover {
    border-color: rgba(16, 185, 129, 0.3);
  }

  .dropdown-arrow {
    transition: transform 0.3s;
  }

  .dropdown-arrow.flipped {
    transform: rotate(180deg);
  }

  .page-dropdown-list {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    right: 0;
    max-height: 200px;
    overflow-y: auto;
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    z-index: 100;
    padding: 0.5rem;
  }

  .page-dropdown-item {
    width: 100%;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    text-align: left;
    color: #94a3b8;
    font-weight: 500;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .page-dropdown-item:hover {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }

  .page-dropdown-item.active {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
  }

  .page-info {
    text-align: center;
    color: #64748b;
    font-size: 0.875rem;
  }

  /* DETAIL VIEW */
  .logs-detail {
    max-width: 1600px;
    margin: 0 auto;
  }

  .logs-header {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: rgba(30, 41, 59, 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
  }

  .btn-back-logs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    color: #94a3b8;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
  }

  .btn-back-logs:hover {
    border-color: rgba(16, 185, 129, 0.3);
    color: #10b981;
    background: rgba(16, 185, 129, 0.05);
  }

  .selected-event-info h3 {
    margin: 0 0 0.5rem 0;
    font-size: 1.5rem;
    color: #f8fafc;
  }

  .event-meta-small {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    align-items: center;
  }

  .event-meta-small span {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #94a3b8;
    font-size: 0.875rem;
  }

  .status-badge-inline {
    padding: 0.25rem 0.75rem;
    background: rgba(148, 163, 184, 0.15);
    border: 1px solid rgba(148, 163, 184, 0.3);
    border-radius: 12px;
    color: #94a3b8;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .status-badge-inline.active {
    background: rgba(16, 185, 129, 0.15);
    border-color: rgba(16, 185, 129, 0.3);
    color: #10b981;
  }

  .logs-action-buttons {
    display: flex;
    gap: 0.75rem;
  }

  .realtime-controls {
    display: flex;
    gap: 0.75rem;
  }

  .btn-new-logs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    background: linear-gradient(135deg, #f59e0b, #d97706);
    border: none;
    border-radius: 12px;
    color: white;
    font-weight: 600;
    cursor: pointer;
    animation: pulse 2s infinite;
  }

  .btn-auto-refresh {
    position: relative;
    width: 40px;
    height: 40px;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.3s;
    color: #94a3b8;
  }

  .btn-auto-refresh.active {
    background: rgba(16, 185, 129, 0.15);
    border-color: rgba(16, 185, 129, 0.3);
    color: #10b981;
  }

  .live-dot {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    width: 6px;
    height: 6px;
    background: #10b981;
    border-radius: 50%;
    animation: pulse 1.5s infinite;
  }

  /* STATS */
  .stats-dashboard-single-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .stat-card-compact {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
  }

  .stat-card-compact.pending {
    border-color: rgba(245, 158, 11, 0.3);
  }

  .stat-icon-compact {
    width: 48px;
    height: 48px;
    background: rgba(245, 158, 11, 0.15);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #f59e0b;
  }

  .stat-info-compact {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .stat-value-compact {
    font-size: 2rem;
    font-weight: 700;
    color: #f8fafc;
    line-height: 1;
  }

  .stat-label-compact {
    color: #94a3b8;
    font-size: 0.875rem;
    font-weight: 500;
    text-transform: uppercase;
  }

  /* FILTERS */
  .filter-section-logs {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .filter-row-logs {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .search-box-logs {
    position: relative;
    flex: 1;
    min-width: 250px;
  }

  .search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: #64748b;
  }

  .search-box-logs input {
    width: 100%;
    padding: 0.875rem 1rem 0.875rem 3rem;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    color: #f8fafc;
    font-size: 0.95rem;
  }

  .search-box-logs input::placeholder {
    color: #64748b;
  }

  .search-box-logs input:focus {
    outline: none;
    border-color: rgba(16, 185, 129, 0.3);
  }

  .nisit-filter-box input {
    padding: 0.875rem 1rem;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    color: #f8fafc;
    font-size: 0.95rem;
    width: 100px;
    text-align: center;
  }

  .nisit-filter-box input:focus {
    outline: none;
    border-color: rgba(16, 185, 129, 0.3);
  }

  .filter-dropdown-logs {
    position: relative;
  }

  .filter-trigger-logs {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1.25rem;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    color: #f8fafc;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s;
  }

  .filter-trigger-logs:hover {
    border-color: rgba(16, 185, 129, 0.3);
  }

  .chevron {
    transition: transform 0.3s;
  }

  .chevron.rotated {
    transform: rotate(180deg);
  }

  .filter-menu-logs {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    min-width: 150px;
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    z-index: 100;
    padding: 0.5rem;
  }

  .filter-option-logs {
    width: 100%;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    text-align: left;
    color: #94a3b8;
    font-weight: 500;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .filter-option-logs:hover {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }

  .filter-option-logs.selected {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
  }

  .date-input-group-logs {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .date-input-group-logs label {
    color: #94a3b8;
    font-size: 0.9rem;
    font-weight: 500;
    white-space: nowrap;
  }

  .custom-date-dropdown-logs {
    position: relative;
  }

  .custom-date-trigger-logs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.875rem 1rem;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    color: #f8fafc;
    cursor: pointer;
    transition: all 0.3s;
    white-space: nowrap;
  }

  .custom-date-trigger-logs:hover {
    border-color: rgba(16, 185, 129, 0.3);
  }

  .custom-date-menu-logs {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    min-width: 180px;
    max-height: 250px;
    overflow-y: auto;
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    z-index: 100;
    padding: 0.5rem;
  }

  .date-option-logs {
    width: 100%;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    text-align: left;
    color: #94a3b8;
    font-weight: 500;
    cursor: pointer;
    border-radius: 8px;
    transition: all 0.2s;
  }

  .date-option-logs:hover {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }

  .date-option-logs.selected {
    background: rgba(16, 185, 129, 0.15);
    color: #10b981;
  }

  .btn-apply-logs, .btn-reset-logs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.875rem 1.25rem;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s;
    white-space: nowrap;
  }

  .btn-apply-logs {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
  }

  .btn-apply-logs:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
  }

  .btn-reset-logs {
    background: rgba(100, 116, 139, 0.15);
    border: 1px solid rgba(100, 116, 139, 0.3);
    color: #94a3b8;
  }

  .btn-reset-logs:hover {
    background: rgba(100, 116, 139, 0.25);
  }

  /* SUBMISSIONS GRID */
  .verify-proof-submissions-section {
    min-height: 400px;
  }

  .submissions-grid-new {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .proof-card {
    position: relative;
    background: rgba(30, 41, 59, 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
    transition: all 0.3s;
  }

  .proof-card:hover {
    border-color: rgba(16, 185, 129, 0.2);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  }

  .rank-circle {
    position: absolute;
    top: 1rem;
    left: 1rem;
    width: 36px;
    height: 36px;
    background: linear-gradient(135deg, #10b981, #059669);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 0.875rem;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
  }

  .user-details {
    padding-top: 1.5rem;
  }

  .user-name {
    margin: 0 0 0.5rem 0;
    font-size: 1.125rem;
    font-weight: 700;
    color: #f8fafc;
  }

  .user-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #94a3b8;
    font-size: 0.875rem;
    margin: 0 0 0.5rem 0;
  }

  .nisit-id {
    font-family: 'Courier New', monospace;
    font-weight: 600;
    color: #10b981;
  }

  .separator {
    color: #475569;
  }

  .status-text {
    color: #f59e0b;
    font-size: 0.875rem;
    font-weight: 600;
    margin: 0;
  }

  .proof-image-box {
    width: 100%;
    height: 200px;
    background: #0f172a;
    border-radius: 12px;
    overflow: hidden;
    position: relative;
    cursor: pointer;
  }

  .proof-image-box img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
  }

  .proof-image-box:hover img {
    transform: scale(1.05);
  }

  .image-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    opacity: 0;
    transition: opacity 0.3s;
    color: white;
  }

  .proof-image-box:hover .image-overlay {
    opacity: 1;
  }

  .no-image-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #64748b;
    font-size: 0.875rem;
  }

  .proof-card-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .btn-reject, .btn-approve {
    padding: 0.875rem 1.25rem;
    border: none;
    border-radius: 12px;
    font-weight: 700;
    font-size: 0.95rem;
    cursor: pointer;
    transition: all 0.3s;
  }

  .btn-reject {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
  }

  .btn-reject:hover {
    background: rgba(239, 68, 68, 0.25);
    transform: translateY(-2px);
  }

  .btn-approve {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  .btn-approve:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
  }

  /* IMAGE MODAL */
  .image-modal {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.3s;
  }

  .modal-content {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
  }

  .modal-content img {
    max-width: 100%;
    max-height: 90vh;
    border-radius: 12px;
  }

  .modal-close {
    position: absolute;
    top: -3rem;
    right: 0;
    width: 40px;
    height: 40px;
    background: rgba(239, 68, 68, 0.9);
    border: none;
    border-radius: 50%;
    color: white;
    font-size: 1.5rem;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* STATES */
  .loading-state, .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 4rem 2rem;
    color: #94a3b8;
  }

  .spinner {
    width: 48px;
    height: 48px;
    border: 4px solid rgba(16, 185, 129, 0.2);
    border-top-color: #10b981;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  /* ANIMATIONS */
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* RESPONSIVE */
  @media (max-width: 768px) {
    .logs-container {
      padding: 1rem;
    }

    .logs-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .filter-row-logs {
      flex-direction: column;
    }

    .search-box-logs {
      min-width: 100%;
    }

    .submissions-grid-new {
      grid-template-columns: 1fr;
    }

    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>