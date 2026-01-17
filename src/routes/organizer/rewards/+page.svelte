<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import axios from 'axios';
  import Swal from 'sweetalert2';
  import html2canvas from 'html2canvas';
  import jsPDF from 'jspdf';
  
  // ===== API Configuration =====
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
  
  // ===== Language =====
  type Language = "th" | "en";
  let currentLang: Language = "th";
  
  if (typeof localStorage !== "undefined") {
    const saved = localStorage.getItem("app_language");
    if (saved === "th" || saved === "en") currentLang = saved;
  }
  
  const translations = {
    th: {
      viewLogs: "ดู Logs",
      backToEvents: "กลับไปหน้ากิจกรรม",
      noResults: "ไม่พบข้อมูล",
      participants: "ผู้เข้าร่วม",
      apply: "ใช้งาน",
      reset: "รีเซ็ต",
      export: "ส่งออก",
      timeline: "ไทม์ไลน์",
      exporting: "กำลังส่งออก...",
      close: "ปิด",
      activityTimeline: "ไทม์ไลน์กิจกรรม",
      noLogs: "ไม่มี Logs",
      loadingLogs: "กำลังโหลด Logs...",
      viewProofImage: "ดูหลักฐาน",
      joinCode: "รหัสเข้าร่วม",
      joined: "ลงทะเบียนเมื่อ",
      checkedIn: "เช็คอินเมื่อ",
      proofSubmitted: "ส่งหลักฐานเมื่อ",
      completed: "สำเร็จเมื่อ",
      cancelled: "ยกเลิกเมื่อ",
      cancellationReason: "เหตุผลการยกเลิก",
      lastUpdated: "อัปเดตล่าสุด",
      showing: "แสดง",
      of: "จาก",
      logs: "logs",
      allActions: "All Actions",
      from: "จาก",
      to: "ถึง",
      selectDate: "เลือกวันที่",
      searchPlaceholder: "ค้นหาด้วยชื่อ, อีเมล หรือ รหัสนิสิต...",
      batch: "รุ่น",
      stdId: "รหัสนิสิต",
      new: "ใหม่",
      autoRefresh: "รีเฟรชอัตโนมัติ",
    },
    en: {
      viewLogs: "View Logs",
      backToEvents: "Back to Events",
      noResults: "No results",
      participants: "Participants",
      apply: "Apply",
      reset: "Reset",
      export: "Export",
      timeline: "Timeline",
      exporting: "Exporting...",
      close: "Close",
      activityTimeline: "Activity Timeline",
      noLogs: "No Logs",
      loadingLogs: "Loading Logs...",
      viewProofImage: "View Proof Image",
      joinCode: "Join Code",
      joined: "Joined",
      checkedIn: "Checked In",
      proofSubmitted: "Proof Submitted",
      completed: "Completed",
      cancelled: "Cancelled",
      cancellationReason: "Cancellation Reason",
      lastUpdated: "Last updated",
      showing: "Showing",
      of: "of",
      logs: "logs",
      allActions: "All Actions",
      from: "From",
      to: "To",
      selectDate: "Select date",
      searchPlaceholder: "Search by name, email, or Nisit ID...",
      batch: "Batch",
      stdId: "Std ID",
      new: "New",
      autoRefresh: "Auto-refresh",
    },
  };
  
  $: lang = translations[currentLang];
  
  // ===== Types =====
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
    totalSlots?: number;
    usedSlots?: number;
    distanceKm?: number;
  }
  
  interface LogEntry {
    id: string;
    action: string;
    userName: string;
    userEmail: string;
    userNisitId: string;
    timestamp: string;
    details?: {
      registrationCode?: string;
      reason?: string;
      [key: string]: any;
    };
    metadata?: {
      joinedAt?: string;
      checkedInAt?: string;
      proof_submitted_at?: string;
      completedAt?: string;
      cancelledAt?: string;
      proof_image_url?: string;
      [key: string]: any;
    };
    proofImage?: string;
  }
  
  interface EventStats {
    total: number;
    by_role: {
      officer: number;
      student: number;
    };
  }
  
  interface LogStatistics {
    uniqueUsers: number;
    totalRegistrations: number;
    totalCheckIns: number;
    totalRewards: number;
    totalCancelled: number;
  }
  
  // ===== State - Events =====
  let events: Event[] = [];
  let selectedEvent: Event | null = null;
  let eventsPage = 1;
  const eventsPerPage = 9;
  let showEventsPageDropdown = false;
  
  // ===== State - Logs =====
  let logs: LogEntry[] = [];
  let filteredLogs: LogEntry[] = [];
  let eventStats: EventStats | null = null;
  let statistics: LogStatistics = {
    uniqueUsers: 0,
    totalRegistrations: 0,
    totalCheckIns: 0,
    totalRewards: 0,
    totalCancelled: 0,
  };
  
  // ===== State - Filters =====
  let searchQuery = "";
  let batchFilter = "";
  let stdIdFilter = "";
  let selectedAction = "";
  let dateFrom = "";
  let dateTo = "";
  let logsNisitYearFilter = "";
  let logsNisitIdFilter = "";
  
  // ===== State - Filter Dropdowns =====
  let actionDropdownOpen = false;
  let dateFromDropdownOpen = false;
  let dateToDropdownOpen = false;
  
  // ===== State - Pagination =====
  let logsPage = 1;
  const logsPerPage = 12;
  let showLogsPageDropdown = false;
  
  // ===== State - UI =====
  let loading = false;
  let autoRefreshEnabled = false;
  let autoRefreshInterval: any;
  let isConnected = false;
  let newLogsCount = 0;
  
  // ===== State - Export =====
  let showExportMenu = false;
  let isExporting = false;
  
  // ===== State - Modals =====
  let showTimelineModal = false;
  let showProofModal = false;
  let proofImageUrl = "";
  
  // ===== Available dates =====
  let availableDates: { value: string; display: string }[] = [];
  
  // ===== Action Configuration =====
  const actionConfigs: Record<string, { label: string; color: string; icon: string }> = {
    officer: {
      label: "Officer",
      color: "#3b82f6",
      icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
    },
    student: {
      label: "Student",
      color: "#a855f7",
      icon: "M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
    },
    registration: {
      label: "Joined",
      color: "#3b82f6",
      icon: "M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
    },
    check_in: {
      label: "Checked In",
      color: "#06b6d4",
      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    },
    reward_unlocked: {
      label: "Completed",
      color: "#10b981",
      icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
    },
    no_show: {
      label: "Rejected",
      color: "#ef4444",
      icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
    },
    registration_cancelled: {
      label: "Cancelled",
      color: "#64748b",
      icon: "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
    },
  };
  
  // ===== Computed =====
  $: paginatedEvents = events.slice((eventsPage - 1) * eventsPerPage, eventsPage * eventsPerPage);
  $: totalEventsPages = Math.ceil(events.length / eventsPerPage);
  $: paginatedLogs = filteredLogs.slice((logsPage - 1) * logsPerPage, logsPage * logsPerPage);
  $: totalLogsPages = Math.ceil(filteredLogs.length / logsPerPage);
  
  // ===== Helper Functions =====
  function getActionConfig(action: string) {
    return actionConfigs[action] || { 
      label: action, 
      color: "#64748b", 
      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" 
    };
  }
  
  function getActionLabel(action: string): string {
    return getActionConfig(action).label;
  }
  
  function getActionColor(action: string): string {
    return getActionConfig(action).color;
  }
  
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
  
  function formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const locale = currentLang === "th" ? "th-TH" : "en-GB";
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  function formatFullDate(timestamp: string): string {
    const date = new Date(timestamp);
    const locale = currentLang === "th" ? "th-TH" : "en-GB";
    return date.toLocaleDateString(locale, {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }
  
  function translateStatus(status: string): string {
    const map: any = {
      Active: currentLang === "th" ? "เปิดใช้งาน" : "Active",
      Closed: currentLang === "th" ? "ปิดแล้ว" : "Closed",
      Draft: currentLang === "th" ? "แบบร่าง" : "Draft",
    };
    return map[status] || status;
  }
  
  function getCapacityPercentage(event: Event): number {
    if (!event.totalSlots) return 0;
    return ((event.usedSlots || 0) / event.totalSlots) * 100;
  }
  
  // ===== Data Loading Functions =====
  async function loadEvents() {
    loading = true;
    try {
      const response = await api.get('/api/events');
      events = response.data;
    } catch (error) {
      console.error('Failed to load events:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load events',
        timer: 2000
      });
    } finally {
      loading = false;
    }
  }
  
  async function selectEventForLogs(event: Event) {
    selectedEvent = event;
    await loadLogs(event.id);
  }
  
  async function loadLogs(eventId: string) {
    loading = true;
    try {
      const [logsResponse, statsResponse] = await Promise.all([
        api.get(`/api/events/${eventId}/logs`),
        api.get(`/api/events/${eventId}/stats`)
      ]);
      
      logs = logsResponse.data;
      eventStats = statsResponse.data;
      
      calculateStatistics();
      extractAvailableDates();
      applyFilters();
      
    } catch (error) {
      console.error('Failed to load logs:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load logs',
        timer: 2000
      });
    } finally {
      loading = false;
    }
  }
  
  function calculateStatistics() {
    const uniqueUserIds = new Set(logs.map(l => l.userNisitId));
    
    statistics = {
      uniqueUsers: uniqueUserIds.size,
      totalRegistrations: logs.filter(l => l.action === 'registration').length,
      totalCheckIns: logs.filter(l => l.action === 'check_in').length,
      totalRewards: logs.filter(l => l.action === 'reward_unlocked').length,
      totalCancelled: logs.filter(l => l.action === 'registration_cancelled').length,
    };
  }
  
  function extractAvailableDates() {
    const dates = [...new Set(logs.map(l => l.timestamp.split('T')[0]))];
    availableDates = dates.sort().reverse().map(d => ({
      value: d,
      display: new Date(d).toLocaleDateString(currentLang === "th" ? "th-TH" : "en-GB", {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    }));
  }
  
  // ===== Filter Functions =====
  function applyFilters() {
    filteredLogs = logs.filter(log => {
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match = log.userName.toLowerCase().includes(q) ||
                      log.userEmail.toLowerCase().includes(q) ||
                      log.userNisitId.toLowerCase().includes(q);
        if (!match) return false;
      }
      
      // Batch filter (logsNisitYearFilter)
      if (logsNisitYearFilter && logsNisitYearFilter.length === 2) {
        if (!log.userNisitId.startsWith(logsNisitYearFilter)) return false;
      }
      
      // Std ID filter (logsNisitIdFilter)
      if (logsNisitIdFilter && logsNisitIdFilter.length > 0) {
        const stdPart = log.userNisitId.substring(2, 8);
        if (!stdPart.includes(logsNisitIdFilter)) return false;
      }
      
      // Action filter
      if (selectedAction && selectedAction !== "") {
        if (log.action !== selectedAction) return false;
      }
      
      // Date filter
      if (dateFrom || dateTo) {
        const logDate = log.timestamp.split('T')[0];
        if (dateFrom && logDate < dateFrom) return false;
        if (dateTo && logDate > dateTo) return false;
      }
      
      return true;
    });
    
    // Reset to page 1
    logsPage = 1;
  }
  
  function resetFilters() {
    searchQuery = "";
    batchFilter = "";
    stdIdFilter = "";
    logsNisitYearFilter = "";
    logsNisitIdFilter = "";
    selectedAction = "";
    dateFrom = "";
    dateTo = "";
    applyFilters();
  }
  
  function closeAllDropdowns() {
    actionDropdownOpen = false;
    dateFromDropdownOpen = false;
    dateToDropdownOpen = false;
    showExportMenu = false;
  }
  
  // ===== Navigation Functions =====
  function backToEventsList() {
    selectedEvent = null;
    logs = [];
    filteredLogs = [];
    resetFilters();
    if (autoRefreshEnabled) {
      toggleAutoRefresh();
    }
  }
  
  // ===== Auto-refresh Functions =====
  function toggleAutoRefresh() {
    autoRefreshEnabled = !autoRefreshEnabled;
    
    if (autoRefreshEnabled) {
      isConnected = true;
      autoRefreshInterval = setInterval(async () => {
        if (selectedEvent) {
          const oldCount = logs.length;
          await loadLogs(selectedEvent.id);
          const newCount = logs.length;
          if (newCount > oldCount) {
            newLogsCount = newCount - oldCount;
          }
        }
      }, 5000);
    } else {
      isConnected = false;
      if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
      }
    }
  }
  
  async function refreshLogs() {
    if (selectedEvent) {
      await loadLogs(selectedEvent.id);
      newLogsCount = 0;
    }
  }
  
  // ===== Export Functions =====
  function toggleExportMenu() {
    showExportMenu = !showExportMenu;
  }
  
  async function exportLogsReport(format: 'png') {
    isExporting = true;
    try {
      const element = document.querySelector('.logs-detail');
      if (!element) return;
      
      const canvas = await html2canvas(element as HTMLElement, {
        backgroundColor: '#0f172a',
        scale: 2
      });
      const link = document.createElement('a');
      link.download = `logs-report-${selectedEvent?.id}-${Date.now()}.png`;
      link.href = canvas.toDataURL();
      link.click();
      
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Report exported successfully',
        timer: 1500
      });
    } catch (error) {
      console.error('Export error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to export report',
        timer: 2000
      });
    } finally {
      isExporting = false;
      showExportMenu = false;
    }
  }
  
  async function exportLogs(format: 'csv' | 'json' | 'pdf' | 'excel') {
    isExporting = true;
    try {
      if (format === 'csv') {
        const csv = convertToCSV(filteredLogs);
        downloadFile(csv, `logs-${selectedEvent?.id}-${Date.now()}.csv`, 'text/csv');
      } else if (format === 'json') {
        const json = JSON.stringify(filteredLogs, null, 2);
        downloadFile(json, `logs-${selectedEvent?.id}-${Date.now()}.json`, 'application/json');
      } else if (format === 'pdf') {
        await exportToPDF();
      } else if (format === 'excel') {
        Swal.fire({
          icon: 'info',
          title: 'Info',
          text: 'Excel export requires xlsx library',
          timer: 2000
        });
      }
      
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: `Exported as ${format.toUpperCase()}`,
        timer: 1500
      });
    } catch (error) {
      console.error('Export error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to export',
        timer: 2000
      });
    } finally {
      isExporting = false;
      showExportMenu = false;
    }
  }
  
  function convertToCSV(data: LogEntry[]): string {
    const headers = ['ID', 'User Name', 'Email', 'Nisit ID', 'Action', 'Timestamp'];
    const rows = data.map(log => [
      log.id,
      log.userName,
      log.userEmail,
      log.userNisitId,
      getActionLabel(log.action),
      formatTimestamp(log.timestamp)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    return csvContent;
  }
  
  async function exportToPDF() {
    const pdf = new jsPDF();
    pdf.setFontSize(16);
    pdf.text(`Logs Report: ${selectedEvent?.title}`, 10, 10);
    pdf.setFontSize(10);
    pdf.text(`Generated: ${new Date().toLocaleString()}`, 10, 20);
    pdf.text(`Total Logs: ${filteredLogs.length}`, 10, 27);
    
    let y = 35;
    filteredLogs.slice(0, 50).forEach((log, idx) => {
      if (y > 280) {
        pdf.addPage();
        y = 10;
      }
      pdf.text(`${idx + 1}. ${log.userName} - ${getActionLabel(log.action)}`, 10, y);
      pdf.setFontSize(8);
      pdf.text(`   ${log.userNisitId} | ${formatTimestamp(log.timestamp)}`, 10, y + 5);
      pdf.setFontSize(10);
      y += 12;
    });
    
    if (filteredLogs.length > 50) {
      pdf.text(`... and ${filteredLogs.length - 50} more logs`, 10, y);
    }
    
    pdf.save(`logs-${selectedEvent?.id}-${Date.now()}.pdf`);
  }
  
  function downloadFile(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }
  
  // ===== Modal Functions =====
  function openProofImage(log: LogEntry) {
    proofImageUrl = log.proofImage || log.metadata?.proof_image_url || '';
    if (proofImageUrl) {
      showProofModal = true;
    }
  }
  
  function closeProofModal() {
    showProofModal = false;
    proofImageUrl = '';
  }
  
  function openTimeline() {
    showTimelineModal = true;
  }
  
  function closeTimeline() {
    showTimelineModal = false;
  }
  
  // ===== Lifecycle =====
  onMount(() => {
    loadEvents();
  });
  
  onDestroy(() => {
    if (autoRefreshInterval) {
      clearInterval(autoRefreshInterval);
    }
  });
</script>

<svelte:window on:click={closeAllDropdowns} />

<!-- ==================== HTML SECTION ==================== -->

        <div class="logs-container">
          {#if !logsData.selectedEvent}
            <!-- Grid Layout เหมือน Event List -->
            <div class="events-selection">
              {#if events.length === 0}
                <div class="empty-state">
                  <svg
                    width="48"
                    height="48"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    ><path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path></svg
                  >
                  <p>{lang.noResults}</p>
                </div>
              {:else if paginatedEventsForLogsDisplay.length === 0}
                <div class="empty-state">
                  <svg
                    width="48"
                    height="48"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="1.5"
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <p>{lang.noResults}</p>
                </div>
              {:else}
                <div class="grid">
                  {#each paginatedEventsForLogsDisplay as event (event.id)}
                    <div class="glass-card">
                      <div class="card-img-wrapper">
                        <img
                          src={event.image ||
                            "https://placehold.co/400x200/1e293b/64748b?text=No+Image"}
                          alt={event.title}
                          class="card-img"
                          loading="lazy"
                          decoding="async"
                          on:error={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              "https://placehold.co/400x200/1e293b/64748b?text=Image+Unavailable";
                          }}
                        />
                      </div>

                      <div class="card-body">
                        <div class="card-header">
                          <h3>{event.title}</h3>
                          <div class="status-group">
                            <span
                              class="status-badge"
                              class:status-active={event.status === "Active"}
                              class:status-closed={event.status === "Closed"}
                              class:status-draft={event.status === "Draft"}
                            >
                              {translateStatus(event.status)}
                            </span>
                          </div>
                        </div>

                        {#if event.description}
                          <p class="event-description-short">
                            {event.description.substring(0, 80)}{event
                              .description.length > 80
                              ? "..."
                              : ""}
                          </p>
                        {/if}

                        <div class="event-simple-meta">
                          <div class="meta-row">
                            <svg
                              width="14"
                              height="14"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              stroke-width="2"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                              ></path>
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                              ></path>
                            </svg>
                            <span>{event.location}</span>
                          </div>

                          <div class="meta-row">
                            <svg
                              width="14"
                              height="14"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              stroke-width="2"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              ></path>
                            </svg>
                            <span>{formatDateRange(event, currentLang)}</span>
                          </div>

                          {#if event.startTime && event.endTime}
                            <div class="meta-row">
                              <svg
                                width="14"
                                height="14"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                stroke-width="2"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                ></path>
                              </svg>
                              <span>{event.startTime} - {event.endTime}</span>
                            </div>
                          {/if}
                          {#if event.distanceKm && event.distanceKm > 0}
                            <div class="meta-row">
                              <svg
                                width="14"
                                height="14"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                                stroke-width="2"
                              >
                                <path
                                  stroke-linecap="round"
                                  stroke-linejoin="round"
                                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                                ></path>
                              </svg>
                              <span>{event.distanceKm} km</span>
                            </div>
                          {/if}
                        </div>

                        {#if event.totalSlots}
                          <div class="card-bottom-section">
                            <div class="capacity-progress">
                              <div class="capacity-info">
                                <span class="capacity-text"
                                  >{event.usedSlots || 0} / {event.totalSlots}
                                  {lang.participants}</span
                                >
                                <span class="capacity-percent"
                                  >{Math.round(
                                    getCapacityPercentage(event)
                                  )}%</span
                                >
                              </div>
                              <div class="progress-bar">
                                <div
                                  class="progress-fill"
                                  style="width: {getCapacityPercentage(event)}%"
                                  class:full={getCapacityPercentage(event) >=
                                    100}
                                ></div>
                              </div>
                            </div>
                          </div>
                        {/if}

                        <div class="action-buttons">
                          <button
                            class="action-btn btn-view"
                            on:click={() => selectEventForLogs(event)}
                          >
                            <svg
                              width="16"
                              height="16"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              stroke-width="2"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                              ></path>
                            </svg>
                            {lang.viewLogs}
                          </button>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>

                <!-- Pagination เหมือน Event List -->
                {#if paginatedEventsForLogs.length > 0 && totalEventsForLogsDisplayPages > 1}
                  <div class="pagination-controls">
                    <button
                      class="page-btn"
                      aria-label="Previous page"
                      on:click={() => {
                        prevEventsForLogsPage();
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      disabled={eventsForLogsPage === 1}
                    >
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 19l-7-7 7-7"
                        ></path>
                      </svg>
                    </button>

                    <div class="page-select-wrapper">
                      <button
                        class="page-indicator-box clickable"
                        on:click|stopPropagation={() =>
                          (showEventsForLogsPageDropdown =
                            !showEventsForLogsPageDropdown)}
                      >
                        <span class="current-page">{eventsForLogsPage}</span>
                        <span class="sep">/</span>
                        <span class="total-page"
                          >{totalEventsForLogsDisplayPages}</span
                        >
                        <svg
                          class="dropdown-arrow"
                          class:flipped={showEventsForLogsPageDropdown}
                          width="12"
                          height="12"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="3"
                            d="M19 9l-7 7-7-7"
                          ></path>
                        </svg>
                      </button>

                      {#if showEventsForLogsPageDropdown}
                        <button
                          type="button"
                          class="click-outside"
                          on:click|stopPropagation={() =>
                            (showEventsForLogsPageDropdown = false)}
                          aria-label="Close dropdown"
                        ></button>
                        <div class="page-dropdown-list">
                          {#each Array(totalEventsForLogsDisplayPages) as _, i}
                            <button
                              class="page-option"
                              class:active={eventsForLogsPage === i + 1}
                              on:click|stopPropagation={() => {
                                jumpToEventsForLogsPage(i + 1);
                                showEventsForLogsPageDropdown = false;
                                window.scrollTo({ top: 0, behavior: "smooth" });
                              }}
                            >
                              Page {i + 1}
                            </button>
                          {/each}
                        </div>
                      {/if}
                    </div>

                    <button
                      class="page-btn"
                      aria-label="Next page"
                      on:click={() => {
                        nextEventsForLogsPage();
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                      disabled={eventsForLogsPage ===
                        totalEventsForLogsDisplayPages}
                    >
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 5l7 7-7 7"
                        ></path>
                      </svg>
                    </button>
                  </div>

                  <!-- Showing text -->
                  <div class="showing-text">
                    Showing {(eventsForLogsPage - 1) * eventsForLogsPerPage + 1}
                    - {Math.min(
                      eventsForLogsPage * eventsForLogsPerPage,
                      filteredEventsForLogs.length
                    )} of {filteredEventsForLogs.length} events
                  </div>
                {/if}
              {/if}
            </div>
          {:else}
            <!-- Logs Detail View -->
            <div class="logs-detail">
              <div class="logs-header">
                <button class="btn-back-logs" on:click={backToEventsList}>
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M15 19l-7-7 7-7"
                    ></path>
                  </svg>
                  Back to Events
                </button>
                <div class="selected-event-info">
                  <h3>{logsData.selectedEvent.title}</h3>
                  <div class="event-meta-small">
                    <span>
                      <svg
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        stroke-width="2.5"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        ></path>
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        ></path>
                      </svg>
                      {logsData.selectedEvent.location}
                    </span>
                    <span>
                      <svg
                        width="14"
                        height="14"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        stroke-width="2.5"
                        >formatDate
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        ></path>
                      </svg>
                      {formatDateRange(logsData.selectedEvent, currentLang)}
                    </span>
                    {#if logsData.selectedEvent.startTime && logsData.selectedEvent.endTime}
                      <span>
                        <svg
                          width="14"
                          height="14"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          stroke-width="2.5"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          ></path>
                        </svg>
                        {logsData.selectedEvent.startTime} - {logsData
                          .selectedEvent.endTime}
                      </span>
                    {/if}
                    <span
                      class="status-badge-inline"
                      class:active={logsData.selectedEvent.status === "Active"}
                      >{logsData.selectedEvent.status}</span
                    >
                  </div>
                </div>

                <!-- ✨ Action Buttons -->
                <div class="logs-action-buttons">
                  <!-- Real-time Indicator & Refresh -->
                  <div class="realtime-controls">
                    {#if newLogsCount > 0}
                      <button class="btn-new-logs" on:click={refreshLogs}>
                        <svg
                          width="16"
                          height="16"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          stroke-width="2.5"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          ></path>
                        </svg>
                        {newLogsCount} New
                      </button>
                    {/if}

                    <button
                      class="btn-auto-refresh"
                      class:active={autoRefreshEnabled}
                      on:click={toggleAutoRefresh}
                      title={autoRefreshEnabled
                        ? "Auto-refresh ON"
                        : "Auto-refresh OFF"}
                    >
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        stroke-width="2.5"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        ></path>
                      </svg>
                      {#if isConnected}
                        <span class="live-dot"></span>
                      {/if}
                    </button>
                  </div>

                  <!-- Timeline Button -->
                  <button
                    class="btn-timeline"
                    on:click|stopPropagation={() => {
                      console.log("Timeline clicked");
                      showTimelineModal = true;
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      stroke-width="2.5"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                    Timeline
                  </button>

                  <!-- Export Button -->
                  <div class="export-dropdown-wrapper">
                    <button
                      class="btn-export"
                      on:click={toggleExportMenu}
                      disabled={isExporting}
                    >
                      {#if isExporting}
                        <svg
                          class="spinner-icon"
                          width="16"
                          height="16"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            class="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            stroke-width="4"
                          ></circle>
                          <path
                            class="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Exporting...
                      {:else}
                        <svg
                          width="16"
                          height="16"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          stroke-width="2.5"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                          ></path>
                        </svg>
                        Export
                      {/if}
                    </button>

                    {#if showExportMenu}
                      <div class="export-menu">
                        <button
                          class="export-option"
                          on:click={() => exportLogsReport("png")}
                        >
                          <svg
                            width="16"
                            height="16"
                            fill="none"
                            stroke="#10b981"
                            viewBox="0 0 24 24"
                            stroke-width="2"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            ></path>
                          </svg>
                          Export Report (PNG)
                        </button>
                        <button
                          class="export-option"
                          on:click={() => exportLogsReport("pdf")}
                        >
                          <svg
                            width="16"
                            height="16"
                            fill="none"
                            stroke="#ef4444"
                            viewBox="0 0 24 24"
                            stroke-width="2"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            ></path>
                          </svg>
                          Export Report (PDF)
                        </button>
                        <button
                          class="export-option"
                          on:click={() => exportLogs("csv")}
                        >
                          <svg
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            stroke-width="2"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            ></path>
                          </svg>
                          Export as CSV
                        </button>
                        <button
                          class="export-option"
                          on:click={() => exportLogs("json")}
                        >
                          <svg
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            stroke-width="2"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                            ></path>
                          </svg>
                          Export as JSON
                        </button>
                        <button
                          class="export-option"
                          on:click={() => exportLogs("pdf")}
                        >
                          <svg
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            stroke-width="2"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            ></path>
                          </svg>
                          Export as PDF
                        </button>
                        <button
                          class="export-option"
                          on:click={() => exportLogs("excel")}
                        >
                          <svg
                            width="16"
                            height="16"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            stroke-width="2"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                            ></path>
                          </svg>
                          Export as Excel
                        </button>
                      </div>
                    {/if}
                  </div>
                </div>
              </div>

              <!-- ✅ Statistics Dashboard - แถวเดียว 4 ตัว -->
              <div class="stats-dashboard-single-row">
                <button
                  class="stat-card-compact clickable"
                  class:active={logsData.selectedAction === ""}
                  on:click={() => {
                    logsData.selectedAction = "";
                    applyLogsFilters();
                  }}
                >
                  <div
                    class="stat-icon-compact"
                    style="background: rgba(100, 116, 139, 0.1);"
                  >
                    <svg
                      width="20"
                      height="20"
                      fill="none"
                      stroke="#64748b"
                      viewBox="0 0 24 24"
                      stroke-width="2"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      ></path>
                    </svg>
                  </div>
                  <div class="stat-info-compact">
                    <div class="stat-value-compact">
                      {logsData.eventStats?.total ||
                        logsData.statistics.uniqueUsers}
                    </div>
                    <div class="stat-label-compact">All</div>
                  </div>
                </button>
                <!-- Officer -->
                <button
                  class="stat-card-compact clickable"
                  class:active={logsData.selectedAction === "officer"}
                  on:click={() => {
                    logsData.selectedAction = "officer";
                    applyLogsFilters();
                  }}
                >
                  <div
                    class="stat-icon-compact"
                    style="background: rgba(59, 130, 246, 0.1);"
                  >
                    <svg
                      width="20"
                      height="20"
                      fill="none"
                      stroke="#3b82f6"
                      viewBox="0 0 24 24"
                      stroke-width="2"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      ></path>
                    </svg>
                  </div>
                  <div class="stat-info-compact">
                    <div class="stat-value-compact">
                      {logsData.eventStats?.by_role?.officer || 0}
                    </div>
                    <div class="stat-label-compact">Officer</div>
                  </div>
                </button>

                <!-- Student -->
                <button
                  class="stat-card-compact clickable"
                  class:active={logsData.selectedAction === "student"}
                  on:click={() => {
                    logsData.selectedAction = "student";
                    applyLogsFilters();
                  }}
                >
                  <div
                    class="stat-icon-compact"
                    style="background: rgba(168, 85, 247, 0.1);"
                  >
                    <svg
                      width="20"
                      height="20"
                      fill="none"
                      stroke="#a855f7"
                      viewBox="0 0 24 24"
                      stroke-width="2"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"
                      ></path>
                    </svg>
                  </div>
                  <div class="stat-info-compact">
                    <div class="stat-value-compact">
                      {logsData.eventStats?.by_role?.student || 0}
                    </div>
                    <div class="stat-label-compact">Student</div>
                  </div>
                </button>

                <!-- Joined -->
                <button
                  class="stat-card-compact clickable"
                  class:active={logsData.selectedAction === "registration"}
                  on:click={() => {
                    logsData.selectedAction = "registration";
                    applyLogsFilters();
                  }}
                >
                  <div
                    class="stat-icon-compact"
                    style="background: rgba(59, 130, 246, 0.1);"
                  >
                    <svg
                      width="20"
                      height="20"
                      fill="none"
                      stroke="#3b82f6"
                      viewBox="0 0 24 24"
                      stroke-width="2"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                      ></path>
                    </svg>
                  </div>
                  <div class="stat-info-compact">
                    <div class="stat-value-compact">
                      {logsData.statistics.totalRegistrations}
                    </div>
                    <div class="stat-label-compact">Joined</div>
                  </div>
                </button>

                <!-- Checked In -->
                <button
                  class="stat-card-compact clickable"
                  class:active={logsData.selectedAction === "check_in"}
                  on:click={() => {
                    logsData.selectedAction = "check_in";
                    applyLogsFilters();
                  }}
                >
                  <div
                    class="stat-icon-compact"
                    style="background: rgba(6, 182, 212, 0.1);"
                  >
                    <svg
                      width="20"
                      height="20"
                      fill="none"
                      stroke="#06b6d4"
                      viewBox="0 0 24 24"
                      stroke-width="2"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                  </div>
                  <div class="stat-info-compact">
                    <div class="stat-value-compact">
                      {logsData.statistics.totalCheckIns}
                    </div>
                    <div class="stat-label-compact">Checked In</div>
                  </div>
                </button>

                <!-- Completed -->
                <button
                  class="stat-card-compact clickable"
                  class:active={logsData.selectedAction === "reward_unlocked"}
                  on:click={() => {
                    logsData.selectedAction = "reward_unlocked";
                    applyLogsFilters();
                  }}
                >
                  <div
                    class="stat-icon-compact"
                    style="background: rgba(16, 185, 129, 0.1);"
                  >
                    <svg
                      width="20"
                      height="20"
                      fill="none"
                      stroke="#10b981"
                      viewBox="0 0 24 24"
                      stroke-width="2"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                  </div>
                  <div class="stat-info-compact">
                    <div class="stat-value-compact">
                      {logsData.statistics.totalRewards}
                    </div>
                    <div class="stat-label-compact">Completed</div>
                  </div>
                </button>

                <!-- Rejected -->
                <button
                  class="stat-card-compact clickable"
                  class:active={logsData.selectedAction === "no_show"}
                  on:click={() => {
                    logsData.selectedAction = "no_show";
                    applyLogsFilters();
                  }}
                >
                  <div
                    class="stat-icon-compact"
                    style="background: rgba(239, 68, 68, 0.1);"
                  >
                    <svg
                      width="20"
                      height="20"
                      fill="none"
                      stroke="#ef4444"
                      viewBox="0 0 24 24"
                      stroke-width="2"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                  </div>
                  <div class="stat-info-compact">
                    <div class="stat-value-compact">
                      {logsData.logs.filter((l) => l.action === "no_show")
                        .length}
                    </div>
                    <div class="stat-label-compact">Rejected</div>
                  </div>
                </button>

                <!-- Cancelled -->
                <button
                  class="stat-card-compact clickable"
                  class:active={logsData.selectedAction ===
                    "registration_cancelled"}
                  on:click={() => {
                    logsData.selectedAction = "registration_cancelled";
                    applyLogsFilters();
                  }}
                >
                  <div
                    class="stat-icon-compact"
                    style="background: rgba(100, 116, 139, 0.1);"
                  >
                    <svg
                      width="20"
                      height="20"
                      fill="none"
                      stroke="#64748b"
                      viewBox="0 0 24 24"
                      stroke-width="2"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                      ></path>
                    </svg>
                  </div>
                  <div class="stat-info-compact">
                    <div class="stat-value-compact">
                      {logsData.statistics.totalCancelled}
                    </div>
                    <div class="stat-label-compact">Cancelled</div>
                  </div>
                </button>
              </div>

              <!-- ✅ Filter Section - ธีมใหม่ -->
              <div class="filter-section-logs">
                <!-- แถว 1: Search Box + Nisit Filters -->
                <div class="filter-row-logs">
                  <div class="search-box-logs">
                    <svg
                      class="search-icon"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      stroke-width="2"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      ></path>
                    </svg>
                    <input
                      class="logs-search-input"
                      type="text"
                      placeholder="Search by name, email, or Nisit ID..."
                      bind:value={logsData.searchQuery}
                      on:input={() => applyLogsFilters()}
                    />
                  </div>
                  <div class="nisit-filter-box">
                    <input
                      class="logs-nisit-input"
                      type="text"
                      placeholder="Batch"
                      maxlength="2"
                      bind:value={logsNisitYearFilter}
                      on:input={(e) => {
                        logsNisitYearFilter = e.currentTarget.value.replace(
                          /\D/g,
                          ""
                        );
                        applyLogsFilters();
                      }}
                    />
                  </div>
                  <div class="nisit-filter-box" style="width: 120px;">
                    <input
                      class="logs-nisit-input"
                      type="text"
                      placeholder="Std ID"
                      maxlength="6"
                      bind:value={logsNisitIdFilter}
                      on:input={(e) => {
                        logsNisitIdFilter = e.currentTarget.value.replace(
                          /\D/g,
                          ""
                        );
                        applyLogsFilters();
                      }}
                    />
                  </div>
                </div>

                <!-- แถว 2: Filters และ Date Range -->
                <div class="filter-row-logs">
                  <div
                    class="filter-dropdown-logs"
                    class:dropdown-open={logsData.actionDropdownOpen}
                  >
                    <button
                      class="filter-trigger-logs"
                      on:click|stopPropagation={() => {
                        const wasOpen = logsData.actionDropdownOpen;
                        closeAllLogsDropdowns();
                        logsData.actionDropdownOpen = !wasOpen;
                      }}
                    >
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                        ></path>
                      </svg>
                      <span
                        >{logsData.selectedAction
                          ? getActionConfig(logsData.selectedAction).label
                          : "All"}</span
                      >
                      <svg
                        class="chevron"
                        class:rotated={logsData.actionDropdownOpen}
                        width="12"
                        height="12"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        stroke-width="2"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          d="M19 9l-7 7-7-7"
                        ></path>
                      </svg>
                    </button>
                    {#if logsData.actionDropdownOpen}
                      <div class="filter-menu-logs">
                        <button
                          class="filter-option-logs"
                          class:selected={!logsData.selectedAction ||
                            logsData.selectedAction === ""}
                          on:click|stopPropagation={() => {
                            logsData.selectedAction = "";
                            logsData.actionDropdownOpen = false;
                            applyLogsFilters();
                          }}>All Actions</button
                        >
                        <button
                          class="filter-option-logs"
                          class:selected={logsData.selectedAction === "officer"}
                          on:click|stopPropagation={() => {
                            logsData.selectedAction = "officer";
                            logsData.actionDropdownOpen = false;
                            applyLogsFilters();
                          }}
                          ><span style="color: #3b82f6;">●</span> Officer</button
                        >
                        <button
                          class="filter-option-logs"
                          class:selected={logsData.selectedAction === "student"}
                          on:click|stopPropagation={() => {
                            logsData.selectedAction = "student";
                            logsData.actionDropdownOpen = false;
                            applyLogsFilters();
                          }}
                          ><span style="color: #a855f7;">●</span> Student</button
                        >
                        <button
                          class="filter-option-logs"
                          class:selected={logsData.selectedAction ===
                            "registration"}
                          on:click|stopPropagation={() => {
                            logsData.selectedAction = "registration";
                            logsData.actionDropdownOpen = false;
                            applyLogsFilters();
                          }}
                          ><span style="color: #3b82f6;">●</span> Joined</button
                        >
                        <button
                          class="filter-option-logs"
                          class:selected={logsData.selectedAction ===
                            "check_in"}
                          on:click|stopPropagation={() => {
                            logsData.selectedAction = "check_in";
                            logsData.actionDropdownOpen = false;
                            applyLogsFilters();
                          }}
                          ><span style="color: #06b6d4;">●</span> Checked In</button
                        >
                        <button
                          class="filter-option-logs"
                          class:selected={logsData.selectedAction ===
                            "reward_unlocked"}
                          on:click|stopPropagation={() => {
                            logsData.selectedAction = "reward_unlocked";
                            logsData.actionDropdownOpen = false;
                            applyLogsFilters();
                          }}
                          ><span style="color: #10b981;">●</span> Completed</button
                        >
                        <button
                          class="filter-option-logs"
                          class:selected={logsData.selectedAction === "no_show"}
                          on:click|stopPropagation={() => {
                            logsData.selectedAction = "no_show";
                            logsData.actionDropdownOpen = false;
                            applyLogsFilters();
                          }}
                          ><span style="color: #ef4444;">●</span> Rejected</button
                        >
                        <button
                          class="filter-option-logs"
                          class:selected={logsData.selectedAction ===
                            "registration_cancelled"}
                          on:click|stopPropagation={() => {
                            logsData.selectedAction = "registration_cancelled";
                            logsData.actionDropdownOpen = false;
                            applyLogsFilters();
                          }}
                          ><span style="color: #64748b;">●</span> Cancelled</button
                        >
                      </div>
                    {/if}
                  </div>

                  <div
                    class="date-input-group-logs"
                    class:dropdown-open={logsData.dateFromDropdownOpen}
                  >
                    <label for="date-from-trigger">From:</label>
                    <div class="custom-date-dropdown-logs">
                      <button
                        class="custom-date-trigger-logs"
                        on:click|stopPropagation={() => {
                          const wasOpen = logsData.dateFromDropdownOpen;
                          closeAllLogsDropdowns();
                          logsData.dateFromDropdownOpen = !wasOpen;
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          ></path>
                        </svg>
                        <span
                          >{logsData.dateFrom
                            ? availableDatesForFilter.find(
                                (d) => d.value === logsData.dateFrom
                              )?.display || logsData.dateFrom
                            : "Select"}</span
                        >
                        <svg
                          class="chevron"
                          class:rotated={logsData.dateFromDropdownOpen}
                          width="10"
                          height="10"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 9l-7 7-7-7"
                          ></path>
                        </svg>
                      </button>
                      {#if logsData.dateFromDropdownOpen}
                        <div class="custom-date-menu-logs">
                          {#each availableDatesForFilter as date}
                            <button
                              class="date-option-logs"
                              class:selected={logsData.dateFrom === date.value}
                              on:click|stopPropagation={() => {
                                logsData.dateFrom = date.value;
                                logsData.dateFromDropdownOpen = false;
                              }}>{date.display}</button
                            >
                          {/each}
                        </div>
                      {/if}
                    </div>
                  </div>

                  <div
                    class="date-input-group-logs"
                    class:dropdown-open={logsData.dateToDropdownOpen}
                  >
                    <label for="date-from-trigger">To:</label>
                    <div class="custom-date-dropdown-logs">
                      <button
                        class="custom-date-trigger-logs"
                        on:click|stopPropagation={() => {
                          const wasOpen = logsData.dateToDropdownOpen;
                          closeAllLogsDropdowns();
                          logsData.dateToDropdownOpen = !wasOpen;
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          ></path>
                        </svg>
                        <span
                          >{logsData.dateTo
                            ? availableDatesForFilter.find(
                                (d) => d.value === logsData.dateTo
                              )?.display || logsData.dateTo
                            : "Select"}</span
                        >
                        <svg
                          class="chevron"
                          class:rotated={logsData.dateToDropdownOpen}
                          width="10"
                          height="10"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 9l-7 7-7-7"
                          ></path>
                        </svg>
                      </button>
                      {#if logsData.dateToDropdownOpen}
                        <div class="custom-date-menu-logs">
                          {#each availableDatesForFilter as date}
                            <button
                              class="date-option-logs"
                              class:selected={logsData.dateTo === date.value}
                              on:click|stopPropagation={() => {
                                logsData.dateTo = date.value;
                                logsData.dateToDropdownOpen = false;
                              }}>{date.display}</button
                            >
                          {/each}
                        </div>
                      {/if}
                    </div>
                  </div>

                  <button class="btn-apply-logs" on:click={applyLogsFilters}>
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                      ></path>
                    </svg>
                    {lang.apply}
                  </button>
                  <button class="btn-reset-logs" on:click={resetLogsFilters}>
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      ></path>
                    </svg>
                    {lang.reset}
                  </button>
                </div>
              </div>

              <!-- Loading State -->
              {#if logsData.loading}
                <div class="loading-state">
                  <div class="spinner"></div>
                  <p>Loading logs...</p>
                </div>
              {/if}

              <!-- Error State -->
              {#if logsData.error}
                <div class="error-state">
                  <svg
                    width="48"
                    height="48"
                    fill="none"
                    stroke="#ef4444"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <p>{logsData.error}</p>
                  <button class="btn-retry" on:click={() => fetchLogs(false)}
                    >Retry</button
                  >
                </div>
              {/if}

              <!-- ✅ Logs Grid Layout (เหมือน Event List) -->
              {#if !logsData.loading && !logsData.error}
                <div class="logs-list-container">
                  {#if paginatedLogsForList.length === 0}
                    <div class="empty-state">
                      <svg
                        width="48"
                        height="48"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="1.5"
                          d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                      <p>{lang.noResults}</p>
                    </div>
                  {:else}
                    <!-- ✅ 2 Column Grid -->
                    <div class="logs-grid-2col">
                      {#each paginatedLogsForList as log, index (log.id + '-' + (log.fetchedAt || log.timestamp || '') + '-' + index)}
                        {@const actionColor = getActionConfig(log.action).color}
                        <div class="log-list-card">
                          <!-- Avatar Circle with Number -->
                          <div
                            class="log-avatar-circle"
                            style="background: linear-gradient(135deg, {actionColor}, {actionColor}dd);"
                          >
                            <span
                              >{index +
                                1 +
                                (logsListPage - 1) * logsListPerPage}</span
                            >
                          </div>

                          <!-- Card Content -->
                          <div class="log-list-content">
                            <!-- Header Row -->
                            <div class="log-list-header">
                              <div class="log-user-info">
                                <h3 class="log-user-name">{log.userName}</h3>
                                <div class="log-user-details">
                                  <span class="log-user-nisit" title="รหัสนิสิต">
                                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2" style="display: inline; vertical-align: middle; margin-right: 4px;">
                                      <path stroke-linecap="round" stroke-linejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path>
                                    </svg>
                                    {log.userNisitId || "N/A"}
                                  </span>
                                  <span class="log-separator">•</span>
                                  <span class="log-user-email" title="อีเมล">{log.userEmail}</span>
                                </div>
                              </div>
                              <button
                                class="log-status-badge-compact clickable-badge"
                                style="background: {actionColor}20; border-color: {actionColor}40; color: {actionColor};"
                                on:click|stopPropagation={() => {
                                  logsData.selectedAction = log.action;
                                  applyLogsFilters();
                                }}
                              >
                                <svg
                                  width="14"
                                  height="14"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  stroke-width="2"
                                >
                                  <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d={getActionConfig(log.action).icon}
                                  ></path>
                                </svg>
                                {getActionLabel(log.action).toUpperCase()}
                              </button>
                            </div>

                            <!-- Details Grid - แสดงทุกสถานะที่มี -->
                            <div class="log-details-grid">
                              <!-- Join Code - แสดงเสมอถ้ามี -->
                              {#if log.details?.registrationCode}
                                <div class="log-detail-item">
                                  <span class="log-detail-label"
                                    >{currentLang === 'th' ? 'รหัสเข้าร่วม:' : 'Join Code:'}</span
                                  >
                                  <span class="log-detail-value log-code"
                                    >{log.details.registrationCode}</span
                                  >
                                </div>
                              {/if}

                              <!-- ✅ Joined - แสดงเสมอถ้ามี joinedAt -->
                              {#if log.metadata?.joinedAt || log.timestamp}
                                <div class="log-detail-item">
                                  <span class="log-detail-label">{currentLang === 'th' ? 'ลงทะเบียนเมื่อ:' : 'Joined:'}</span>
                                  <span class="log-detail-value">
                                    {formatFullDate(log.metadata?.joinedAt || log.timestamp)}
                                  </span>
                                </div>
                              {/if}

                              <!-- ✅ Checked In - แสดงถ้ามี checkedInAt -->
                              {#if log.metadata?.checkedInAt}
                                <div class="log-detail-item">
                                  <span class="log-detail-label"
                                    >{currentLang === 'th' ? 'เช็คอินเมื่อ:' : 'Checked In:'}</span
                                  >
                                  <span class="log-detail-value">
                                    {formatFullDate(log.metadata.checkedInAt)}
                                  </span>
                                </div>
                              {/if}

                              <!-- ✅ Proof Submitted - แสดงถ้ามี proof_submitted_at -->
                              {#if log.metadata?.proof_submitted_at}
                                <div class="log-detail-item">
                                  <span class="log-detail-label"
                                    >{currentLang === 'th' ? 'ส่งหลักฐานเมื่อ:' : 'Proof Submitted:'}</span
                                  >
                                  <span class="log-detail-value">
                                    {formatFullDate(log.metadata.proof_submitted_at)}
                                  </span>
                                </div>
                              {/if}

                              <!-- ✅ Completed - แสดงถ้ามี completedAt -->
                              {#if log.metadata?.completedAt}
                                <div class="log-detail-item">
                                  <span class="log-detail-label"
                                    >{currentLang === 'th' ? 'สำเร็จเมื่อ:' : 'Completed:'}</span
                                  >
                                  <span class="log-detail-value">
                                    {formatFullDate(log.metadata.completedAt)}
                                  </span>
                                </div>
                              {/if}

                              <!-- ✅ Cancelled - แสดงถ้ามี cancelledAt -->
                              {#if log.metadata?.cancelledAt}
                                <div class="log-detail-item">
                                  <span class="log-detail-label"
                                    >{currentLang === 'th' ? 'ยกเลิกเมื่อ:' : 'Cancelled:'}</span
                                  >
                                  <span class="log-detail-value">
                                    {formatFullDate(log.metadata.cancelledAt)}
                                  </span>
                                </div>
                              {/if}
                            </div>

                            <!-- View Proof Image - แสดงเมื่อมี proof หรือ status completed -->
                            {#if log.action === "reward_unlocked" || log.proofImage || log.metadata?.proof_image_url}
                              <button
                                class="log-proof-link"
                                on:click|stopPropagation={() =>
                                  openProofImage(log)}
                              >
                                <svg
                                  width="16"
                                  height="16"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  stroke-width="2"
                                >
                                  <path
                                    stroke-linecap="round"
                                    stroke-linejoin="round"
                                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  ></path>
                                </svg>
                                <span>{currentLang === 'th' ? 'ดูหลักฐาน' : 'View Proof Image'}</span>
                              </button>
                            {/if}

                            <!-- Cancellation Reason - แสดงเฉพาะ Cancelled -->
                            {#if log.action === "registration_cancelled" && log.details?.reason}
                              <div class="log-cancellation-reason">
                                <strong>{currentLang === 'th' ? 'เหตุผลการยกเลิก:' : 'Cancellation Reason:'}</strong>
                                <p>{log.details.reason}</p>
                              </div>
                            {/if}

                            <!-- Footer -->
                            <div class="log-list-footer">
                              <span class="log-last-updated"
                                >{currentLang === 'th' ? 'อัปเดตล่าสุด:' : 'Last updated:'} {formatTimestamp(
                                  log.timestamp
                                )}</span
                              >
                            </div>
                          </div>
                        </div>
                      {/each}
                    </div>
                  {/if}
                </div>

                <!-- ✅ Pagination (เหมือน Event List) -->
                {#if paginatedLogsForList.length > 0 && totalLogsListPages > 1}
                  <div class="pagination-controls">
                    <button
                      class="page-btn"
                      aria-label="Previous page"
                      on:click={prevLogsListPage}
                      disabled={logsListPage === 1}
                    >
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15 19l-7-7 7-7"
                        ></path>
                      </svg>
                    </button>

                    <div class="page-select-wrapper">
                      <button
                        class="page-indicator-box clickable"
                        on:click|stopPropagation={() =>
                          (showLogsPageDropdown = !showLogsPageDropdown)}
                      >
                        <span class="current-page">{logsListPage}</span>
                        <span class="sep">/</span>
                        <span class="total-page">{totalLogsListPages}</span>
                        <svg
                          class="dropdown-arrow"
                          class:flipped={showLogsPageDropdown}
                          width="12"
                          height="12"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="3"
                            d="M19 9l-7 7-7-7"
                          ></path></svg
                        >
                      </button>

                      {#if showLogsPageDropdown}
                        <div
                          class="click-outside"
                          role="button"
                          tabindex="0"
                          on:click|stopPropagation={() =>
                            (showLogsPageDropdown = false)}
                          on:keydown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              showLogsPageDropdown = false;
                            }
                          }}
                        ></div>
                        <div class="page-dropdown-list">
                          {#each Array(totalLogsListPages) as _, i}
                            <button
                              class="page-option"
                              class:active={logsListPage === i + 1}
                              on:click|stopPropagation={() => {
                                jumpToLogsListPage(i + 1);
                                showLogsPageDropdown = false;
                              }}
                            >
                              Page {i + 1}
                            </button>
                          {/each}
                        </div>
                      {/if}
                    </div>

                    <button
                      class="page-btn"
                      aria-label="Next page"
                      on:click={nextLogsListPage}
                      disabled={logsListPage === totalLogsListPages}
                    >
                      <svg
                        width="16"
                        height="16"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M9 5l7 7-7 7"
                        ></path>
                      </svg>
                    </button>
                  </div>
                  <!-- Showing text -->
                  <div class="showing-text">
                    Showing {(logsListPage - 1) * logsListPerPage + 1} - {Math.min(
                      logsListPage * logsListPerPage,
                      logsToDisplay.length
                    )} of {logsToDisplay.length} logs
                  </div>
                {/if}
              {/if}
            </div>
          {/if}
        </div>

<!-- ==================== TIMELINE MODAL ==================== -->
{#if showTimelineModal}
  <div class="timeline-modal" on:click={closeTimeline}>
    <div class="timeline-modal-content" on:click|stopPropagation>
      <div class="timeline-modal-header">
        <h2>{lang.activityTimeline}</h2>
        <button class="modal-close-btn" on:click={closeTimeline}>
          <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <div class="timeline-container">
        {#if logs.length === 0}
          <div class="empty-state-timeline">
            <svg width="48" height="48" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p>{lang.noLogs}</p>
          </div>
        {:else}
          {#each logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()) as log}
            {@const config = getActionConfig(log.action)}
            <div class="timeline-item">
              <div class="timeline-marker" style="background: {config.color};">
                <svg width="20" height="20" fill="none" stroke="white" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d={config.icon}></path>
                </svg>
              </div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="timeline-action" style="color: {config.color};">{config.label}</span>
                  <span class="timeline-time">{formatTimestamp(log.timestamp)}</span>
                </div>
                <div class="timeline-user">
                  <strong>{log.userName}</strong>
                  <span class="timeline-nisit">({log.userNisitId})</span>
                </div>
                {#if log.details?.registrationCode}
                  <div class="timeline-detail">Code: {log.details.registrationCode}</div>
                {/if}
              </div>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- ==================== PROOF IMAGE MODAL ==================== -->
{#if showProofModal}
  <div class="proof-modal" on:click={closeProofModal}>
    <div class="proof-modal-content" on:click|stopPropagation>
      <button class="modal-close-btn" on:click={closeProofModal}>
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
      <img src={proofImageUrl} alt="Proof" class="proof-image" />
    </div>
  </div>
{/if}


<style>
  /* ==================== CONTAINER ==================== */
  .logs-container {
    width: 100%;
    min-height: 60vh;
  }

  /* ==================== EVENT SELECTION GRID ==================== */
  .events-selection {
    width: 100%;
  }

  .events-selection .grid {
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
    height: 100%;
  }

  .glass-card:hover {
    transform: translateY(-4px);
    border-color: rgba(16, 185, 129, 0.4);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.3);
  }

  .card-img-wrapper {
    position: relative;
    width: 100%;
    height: 200px;
    overflow: hidden;
  }

  .card-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
  }

  .glass-card:hover .card-img {
    transform: scale(1.05);
  }

  .card-body {
    padding: 1.5rem;
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 0.75rem;
    margin-bottom: 0.75rem;
  }

  .card-header h3 {
    flex: 1;
    margin: 0;
    font-size: 1.125rem;
    font-weight: 700;
    color: #f8fafc;
    line-height: 1.4;
  }

  .status-badge {
    padding: 0.375rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    flex-shrink: 0;
  }

  .status-active {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.3);
  }

  .status-closed {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }

  .status-draft {
    background: rgba(100, 116, 139, 0.2);
    color: #94a3b8;
    border: 1px solid rgba(100, 116, 139, 0.3);
  }

  .event-description-short {
    color: #cbd5e1;
    font-size: 0.9rem;
    line-height: 1.6;
    margin-bottom: 1rem;
  }

  .event-simple-meta {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-bottom: 1rem;
  }

  .meta-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #94a3b8;
    font-size: 0.85rem;
  }

  .meta-row svg {
    flex-shrink: 0;
    color: #10b981;
  }

  .capacity-progress {
    margin: 1rem 0;
  }

  .capacity-info {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    font-size: 0.85rem;
    color: #94a3b8;
  }

  .progress-bar {
    height: 8px;
    background: rgba(100, 116, 139, 0.2);
    border-radius: 10px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #10b981, #059669);
    border-radius: 10px;
    transition: width 0.3s;
  }

  .action-buttons {
    margin-top: auto;
  }

  .action-btn {
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.3s;
    border: none;
  }

  .btn-view {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  .btn-view:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
  }

  /* ==================== LOGS DETAIL VIEW ==================== */
  .logs-detail {
    animation: fadeIn 0.3s ease;
  }

  .logs-header {
    background: rgba(30, 41, 59, 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 1.5rem;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    gap: 1.5rem;
    flex-wrap: wrap;
  }

  .btn-back-logs {
    background: rgba(100, 116, 139, 0.2);
    border: 1px solid rgba(100, 116, 139, 0.3);
    color: #94a3b8;
    padding: 0.625rem 1rem;
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 600;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .btn-back-logs:hover {
    background: rgba(100, 116, 139, 0.3);
    border-color: #64748b;
    color: #f8fafc;
    transform: translateX(-2px);
  }

  .selected-event-info {
    flex: 1;
    min-width: 250px;
  }

  .selected-event-info h3 {
    font-size: 1.25rem;
    font-weight: 700;
    color: #f8fafc;
    margin: 0 0 0.5rem 0;
  }

  .event-meta-small {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    font-size: 0.85rem;
    color: #94a3b8;
    align-items: center;
  }

  .event-meta-small > span {
    display: flex;
    align-items: center;
    gap: 0.375rem;
  }

  .status-badge-inline {
    display: inline-flex;
    padding: 0.25rem 0.75rem;
    border-radius: 12px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .status-badge-inline.active {
    background: rgba(16, 185, 129, 0.2);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #10b981;
  }

  .logs-action-buttons {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .realtime-controls {
    display: flex;
    gap: 0.5rem;
  }

  .btn-new-logs {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: white;
    padding: 0.625rem 1rem;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    border: none;
    animation: pulse 2s infinite;
  }

  .btn-auto-refresh {
    background: rgba(100, 116, 139, 0.2);
    border: 1px solid rgba(100, 116, 139, 0.3);
    color: #94a3b8;
    padding: 0.625rem 1rem;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
  }

  .btn-auto-refresh.active {
    background: rgba(16, 185, 129, 0.2);
    border-color: rgba(16, 185, 129, 0.4);
    color: #10b981;
  }

  .live-dot {
    width: 8px;
    height: 8px;
    background: #10b981;
    border-radius: 50%;
    animation: pulse 2s infinite;
  }

  .btn-timeline,
  .btn-export {
    background: rgba(59, 130, 246, 0.2);
    border: 1px solid rgba(59, 130, 246, 0.3);
    color: #3b82f6;
    padding: 0.625rem 1rem;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.85rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-timeline:hover,
  .btn-export:hover {
    background: rgba(59, 130, 246, 0.3);
    border-color: #3b82f6;
  }

  .btn-export:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .export-dropdown-wrapper {
    position: relative;
  }

  .export-menu {
    position: absolute;
    top: calc(100% + 0.5rem);
    right: 0;
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 0.5rem;
    min-width: 200px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    z-index: 100;
    animation: slideDown 0.2s ease;
  }

  .export-option {
    width: 100%;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    color: #f8fafc;
    text-align: left;
    cursor: pointer;
    border-radius: 8px;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    transition: all 0.2s;
  }

  .export-option:hover {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }

  /* ==================== STATS DASHBOARD ==================== */
  .stats-dashboard-single-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .stat-card-compact {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem 1.25rem;
    background: rgba(30, 41, 59, 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.3s;
  }

  .stat-card-compact.clickable:hover {
    border-color: rgba(16, 185, 129, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  }

  .stat-card-compact.active {
    border-color: #10b981;
    background: rgba(16, 185, 129, 0.05);
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }

  .stat-icon-compact {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .stat-info-compact {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .stat-value-compact {
    font-size: 1.75rem;
    font-weight: 700;
    color: #f8fafc;
    line-height: 1;
  }

  .stat-label-compact {
    font-size: 0.875rem;
    font-weight: 500;
    color: #94a3b8;
    line-height: 1;
  }

  /* ==================== FILTERS ==================== */
  .filter-section-logs {
    background: rgba(30, 41, 59, 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  .filter-row-logs {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
    align-items: center;
  }

  .filter-row-logs:last-child {
    margin-bottom: 0;
  }

  .search-box-logs {
    flex: 1;
    min-width: 250px;
  }

  .search-box-logs input {
    width: 100%;
    padding: 0.75rem 1rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    color: #f8fafc;
    font-size: 0.9rem;
  }

  .search-box-logs input::placeholder {
    color: #64748b;
  }

  .search-box-logs input:focus {
    outline: none;
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }

  .nisit-filter-box {
    width: 80px;
  }

  .logs-nisit-input {
    width: 100%;
    padding: 0.75rem 1rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    color: #f8fafc;
    font-size: 0.9rem;
    text-align: center;
    font-weight: 600;
  }

  .logs-nisit-input:focus {
    outline: none;
    border-color: #10b981;
  }

  .filter-dropdown-logs {
    position: relative;
  }

  .filter-trigger-logs {
    padding: 0.75rem 1rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    color: #f8fafc;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    min-width: 150px;
    transition: all 0.2s;
  }

  .filter-trigger-logs:hover {
    border-color: rgba(16, 185, 129, 0.4);
  }

  .filter-trigger-logs .chevron {
    margin-left: auto;
    transition: transform 0.2s;
  }

  .filter-trigger-logs .chevron.rotated {
    transform: rotate(180deg);
  }

  .filter-menu-logs {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 0.5rem;
    min-width: 200px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    z-index: 100;
    animation: slideDown 0.2s ease;
  }

  .filter-option-logs {
    width: 100%;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    color: #f8fafc;
    text-align: left;
    cursor: pointer;
    border-radius: 8px;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    transition: all 0.2s;
  }

  .filter-option-logs:hover {
    background: rgba(16, 185, 129, 0.1);
  }

  .filter-option-logs.selected {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }

  .date-input-group-logs {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    position: relative;
  }

  .date-input-group-logs label {
    color: #94a3b8;
    font-size: 0.85rem;
    font-weight: 600;
  }

  .custom-date-dropdown-logs {
    position: relative;
  }

  .custom-date-trigger-logs {
    padding: 0.75rem 1rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    color: #f8fafc;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    min-width: 150px;
  }

  .custom-date-menu-logs {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 0.5rem;
    max-height: 300px;
    overflow-y: auto;
    min-width: 200px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    z-index: 100;
    animation: slideDown 0.2s ease;
  }

  .date-option-logs {
    width: 100%;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    color: #f8fafc;
    text-align: left;
    cursor: pointer;
    border-radius: 8px;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .date-option-logs:hover {
    background: rgba(16, 185, 129, 0.1);
  }

  .date-option-logs.selected {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }

  .btn-apply-logs,
  .btn-reset-logs {
    padding: 0.75rem 1.5rem;
    border-radius: 12px;
    font-weight: 600;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
  }

  .btn-apply-logs {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }

  .btn-apply-logs:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
  }

  .btn-reset-logs {
    background: rgba(100, 116, 139, 0.2);
    border: 1px solid rgba(100, 116, 139, 0.3);
    color: #94a3b8;
  }

  .btn-reset-logs:hover {
    background: rgba(100, 116, 139, 0.3);
    border-color: #64748b;
  }

  /* ==================== LOGS LIST ==================== */
  .logs-list-section {
    margin-bottom: 2rem;
  }

  .logs-list-grid {
    display: grid;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }

  .log-list-card {
    background: rgba(30, 41, 59, 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 1.5rem;
    transition: all 0.3s;
  }

  .log-list-card:hover {
    border-color: rgba(16, 185, 129, 0.3);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  }

  .log-list-header {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;
  }

  .log-rank-badge {
    min-width: 40px;
    height: 40px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 0.9rem;
    flex-shrink: 0;
  }

  .log-user-info {
    flex: 1;
    min-width: 200px;
  }

  .log-user-name {
    font-size: 1.125rem;
    font-weight: 700;
    color: #f8fafc;
    margin-bottom: 0.25rem;
  }

  .log-user-meta {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.85rem;
    color: #94a3b8;
    flex-wrap: wrap;
  }

  .log-user-nisit {
    font-family: 'Courier New', monospace;
    color: #10b981;
    font-weight: 600;
  }

  .log-separator {
    color: #64748b;
  }

  .log-status-badge-compact {
    padding: 0.5rem 1rem;
    border: 1px solid;
    border-radius: 20px;
    font-size: 0.75rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.3s;
    flex-shrink: 0;
  }

  .log-status-badge-compact:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .log-details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
    margin: 1rem 0;
  }

  .log-detail-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .log-detail-label {
    font-size: 0.8rem;
    color: #64748b;
    font-weight: 600;
  }

  .log-detail-value {
    font-size: 0.9rem;
    color: #f8fafc;
  }

  .log-code {
    font-family: 'Courier New', monospace;
    color: #3b82f6;
    font-weight: 700;
  }

  .log-proof-link {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: rgba(59, 130, 246, 0.2);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 12px;
    color: #3b82f6;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 1rem;
  }

  .log-proof-link:hover {
    background: rgba(59, 130, 246, 0.3);
    border-color: #3b82f6;
  }

  .log-cancellation-reason {
    margin-top: 1rem;
    padding: 1rem;
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.2);
    border-radius: 12px;
  }

  .log-cancellation-reason strong {
    color: #ef4444;
    font-size: 0.85rem;
    display: block;
    margin-bottom: 0.5rem;
  }

  .log-cancellation-reason p {
    color: #f8fafc;
    font-size: 0.9rem;
    margin: 0;
  }

  .log-list-footer {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    font-size: 0.8rem;
    color: #64748b;
  }

  /* ==================== PAGINATION ==================== */
  .pagination-wrapper {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-top: 2rem;
  }

  .pagination-controls {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .page-btn {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    color: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .page-btn:hover:not(:disabled) {
    background: rgba(16, 185, 129, 0.2);
    border-color: #10b981;
  }

  .page-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .page-select-wrapper {
    position: relative;
  }

  .page-indicator-box {
    padding: 0.5rem 1rem;
    background: rgba(30, 41, 59, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-weight: 600;
    color: #f8fafc;
  }

  .page-indicator-box .sep {
    color: #64748b;
  }

  .dropdown-arrow {
    transition: transform 0.2s;
  }

  .dropdown-arrow.flipped {
    transform: rotate(180deg);
  }

  .page-dropdown-list {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 50%;
    transform: translateX(-50%);
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 0.5rem;
    max-height: 300px;
    overflow-y: auto;
    min-width: 120px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    z-index: 100;
    animation: slideDown 0.2s ease;
  }

  .page-option {
    width: 100%;
    padding: 0.75rem 1rem;
    background: transparent;
    border: none;
    color: #f8fafc;
    text-align: center;
    cursor: pointer;
    border-radius: 8px;
    font-size: 0.9rem;
    transition: all 0.2s;
  }

  .page-option:hover {
    background: rgba(16, 185, 129, 0.1);
  }

  .page-option.active {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
    font-weight: 700;
  }

  .showing-text {
    font-size: 0.9rem;
    color: #94a3b8;
    text-align: center;
  }

  /* ==================== TIMELINE MODAL ==================== */
  .timeline-modal {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.3s;
  }

  .timeline-modal-content {
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    max-width: 800px;
    width: 90%;
    max-height: 80vh;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    animation: slideUp 0.3s;
  }

  .timeline-modal-header {
    padding: 1.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .timeline-modal-header h2 {
    font-size: 1.5rem;
    font-weight: 700;
    color: #f8fafc;
    margin: 0;
  }

  .modal-close-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: rgba(239, 68, 68, 0.2);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .modal-close-btn:hover {
    background: rgba(239, 68, 68, 0.3);
    transform: rotate(90deg);
  }

  .timeline-container {
    padding: 2rem;
    overflow-y: auto;
    flex: 1;
  }

  .empty-state-timeline {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 3rem;
    color: #64748b;
  }

  .empty-state-timeline svg {
    margin-bottom: 1rem;
  }

  .timeline-item {
    display: flex;
    gap: 1.5rem;
    margin-bottom: 2rem;
    position: relative;
  }

  .timeline-item::before {
    content: "";
    position: absolute;
    left: 20px;
    top: 50px;
    width: 2px;
    height: calc(100% + 2rem);
    background: rgba(255, 255, 255, 0.1);
  }

  .timeline-item:last-child::before {
    display: none;
  }

  .timeline-marker {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  .timeline-content {
    flex: 1;
    padding: 0.5rem 0;
  }

  .timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .timeline-action {
    font-size: 0.95rem;
    font-weight: 700;
  }

  .timeline-time {
    font-size: 0.8rem;
    color: #64748b;
  }

  .timeline-user {
    font-size: 0.9rem;
    color: #f8fafc;
    margin-bottom: 0.25rem;
  }

  .timeline-nisit {
    color: #64748b;
    font-size: 0.85rem;
  }

  .timeline-detail {
    font-size: 0.85rem;
    color: #94a3b8;
    margin-top: 0.5rem;
  }

  /* ==================== PROOF MODAL ==================== */
  .proof-modal {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.95);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    padding: 2rem;
    animation: fadeIn 0.3s;
  }

  .proof-modal-content {
    position: relative;
    max-width: 90vw;
    max-height: 90vh;
    animation: slideUp 0.3s;
  }

  .proof-modal-content .modal-close-btn {
    position: absolute;
    top: -50px;
    right: 0;
  }

  .proof-image {
    max-width: 100%;
    max-height: 90vh;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
  }

  /* ==================== LOADING & EMPTY STATES ==================== */
  .loading-state,
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    color: #64748b;
  }

  .loading-state svg,
  .empty-state svg {
    margin-bottom: 1rem;
    animation: pulse 2s infinite;
  }

  .loading-state p,
  .empty-state p {
    font-size: 1rem;
    margin: 0;
  }

  .spinner-icon {
    animation: spin 1s linear infinite;
  }

  /* ==================== ANIMATIONS ==================== */
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.5;
    }
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* ==================== RESPONSIVE ==================== */
  @media (max-width: 768px) {
    .logs-header {
      flex-direction: column;
      align-items: stretch;
    }

    .logs-action-buttons {
      width: 100%;
      justify-content: space-between;
    }

    .stats-dashboard-single-row {
      grid-template-columns: repeat(2, 1fr);
    }

    .filter-row-logs {
      flex-direction: column;
      align-items: stretch;
    }

    .search-box-logs,
    .nisit-filter-box,
    .filter-dropdown-logs,
    .date-input-group-logs {
      width: 100%;
    }

    .events-selection .grid {
      grid-template-columns: 1fr;
    }

    .timeline-modal-content {
      width: 95%;
      max-height: 90vh;
    }
  }

  @media (max-width: 640px) {
    .stats-dashboard-single-row {
      grid-template-columns: 1fr;
    }

    .log-list-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .log-rank-badge {
      align-self: flex-start;
    }
  }
</style>