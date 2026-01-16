<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  
  // Import stores (using relative path, can change to alias later)
  import { appState } from './_lib/stores/appState';
  import { auth } from './_lib/stores/auth';
  import { t } from './_lib/i18n';
  
  // ==========================================
  // 📋 MENU CONFIGURATION
  // ==========================================
  const menuItems = [
    {
      id: 'events',
      path: '/organizer/events',
      label: { th: 'กิจกรรม', en: 'Events' },
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01'
    },
    {
      id: 'create-event',
      path: '/organizer/create-event',
      label: { th: 'สร้างกิจกรรม', en: 'Create Event' },
      icon: 'M12 4v16m8-8H4'
    },
    {
      id: 'verify-code',
      path: '/organizer/verify-code',
      label: { th: 'ตรวจรหัส', en: 'Verify Code' },
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    {
      id: 'verify-proof',
      path: '/organizer/verify-proof',
      label: { th: 'ตรวจสอบหลักฐาน', en: 'Verify Proof' },
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    },
    {
      id: 'unlock',
      path: '/organizer/unlock',
      label: { th: 'ปลดล็อค', en: 'Unlock' },
      icon: 'M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z'
    },
    {
      id: 'logs',
      path: '/organizer/logs',
      label: { th: 'ประวัติ', en: 'Logs' },
      icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    {
      id: 'rewards',
      path: '/organizer/rewards',
      label: { th: 'รางวัล', en: 'Rewards' },
      icon: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V6a2 2 0 10-2 2h2zm0 0h4l-4 4-4-4h4z'
    },
    {
      id: 'settings',
      path: '/organizer/settings',
      label: { th: 'ตั้งค่า', en: 'Settings' },
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
    }
  ];
  
  // ==========================================
  // 🌐 STATE & REACTIVE VARIABLES
  // ==========================================
  
  // Determine current active menu based on URL
  $: currentPath = $page.url.pathname;
  $: activeMenuId = menuItems.find(item => 
    currentPath.startsWith(item.path)
  )?.id || 'events';
  
  // Mobile menu state
  let isMobileMenuOpen = false;
  
  // Token timer
  let timerInterval: any;
  
  // ==========================================
  // 🔧 FUNCTIONS
  // ==========================================
  
  /**
   * Toggle language between Thai and English
   */
  function toggleLanguage() {
    appState.update(state => ({
      ...state,
      currentLang: state.currentLang === 'th' ? 'en' : 'th'
    }));
    
    // Save to localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('app_language', $appState.currentLang);
    }
  }
  
  /**
   * Handle logout - clear all data and redirect to login
   */
  async function handleLogout() {
    // Clear all stores
    auth.logout();
    
    // Clear all storage (but keep language)
    if (typeof localStorage !== 'undefined') {
      const lang = localStorage.getItem('app_language');
      localStorage.clear();
      sessionStorage.clear();
      if (lang) localStorage.setItem('app_language', lang);
    }
    
    // Redirect to login
    goto('/auth/login');
  }
  
  /**
   * Format time from seconds to MM:SS
   */
  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  /**
   * Navigate to a menu item
   */
  function navigateTo(path: string) {
    isMobileMenuOpen = false;
    goto(path);
  }
  
  /**
   * Close mobile menu when clicking outside
   */
  function handleClickOutside(event: MouseEvent) {
    if (isMobileMenuOpen) {
      const target = event.target as HTMLElement;
      if (!target.closest('.mobile-menu') && !target.closest('.mobile-menu-btn')) {
        isMobileMenuOpen = false;
      }
    }
  }
  
  // ==========================================
  // 🔄 LIFECYCLE
  // ==========================================
  
  onMount(() => {
    // Start token countdown timer
    timerInterval = setInterval(() => {
      auth.update(state => ({
        ...state,
        timeLeft: Math.max(0, state.timeLeft - 1)
      }));
      
      // Auto logout when timer reaches 0
      if ($auth.timeLeft <= 0) {
        handleLogout();
      }
    }, 1000);
    
    // Add click listener for mobile menu
    if (typeof window !== 'undefined') {
      window.addEventListener('click', handleClickOutside);
    }
  });
  
  onDestroy(() => {
    // Clear timer
    if (timerInterval) {
      clearInterval(timerInterval);
    }
    
    // Remove click listener
    if (typeof window !== 'undefined') {
      window.removeEventListener('click', handleClickOutside);
    }
  });
</script>

<svelte:head>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link
    href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
    rel="stylesheet"
  />
</svelte:head>

<div class="app-container">
  <!-- ==========================================
       HEADER BAR
       ========================================== -->
  <header class="header-bar">
    <div class="header-inner">
      <!-- Brand -->
      <div class="brand">
        <div class="logo-container">
          <!-- Logo SVG -->
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <span class="brand-name">{t('organizer')}</span>
      </div>

      <!-- Mobile Menu Toggle -->
      <button
        class="mobile-menu-btn mobile-only"
        on:click={() => (isMobileMenuOpen = !isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        <svg
          class="menu-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {#if isMobileMenuOpen}
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M6 18L18 6M6 6l12 12"
            />
          {:else}
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 6h16M4 12h16M4 18h16"
            />
          {/if}
        </svg>
      </button>

      <!-- Desktop Navigation -->
      <nav class="nav-menu desktop-only">
        {#each menuItems as item}
          <button
            class="menu-btn"
            class:active={activeMenuId === item.id}
            on:click={() => navigateTo(item.path)}
          >
            <svg
              class="menu-icon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d={item.icon}
              />
            </svg>
            <span class="menu-label">{item.label[$appState.currentLang]}</span>
          </button>
        {/each}
      </nav>

      <!-- User Zone -->
      <div class="user-zone">
        <!-- Language Toggle -->
        <button
          class="lang-toggle-btn"
          on:click={toggleLanguage}
          title={$appState.currentLang === 'th'
            ? 'Switch to English'
            : 'เปลี่ยนเป็นภาษาไทย'}
          aria-label="Toggle language"
        >
          <span class="lang-option" class:active={$appState.currentLang === 'th'}>TH</span>
          <span class="lang-divider">/</span>
          <span class="lang-option" class:active={$appState.currentLang === 'en'}>EN</span>
        </button>

        <!-- Token Timer -->
        <div class="token-timer" class:warning={$auth.timeLeft < 60}>
          <svg class="timer-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{formatTime($auth.timeLeft)}</span>
        </div>

        <!-- Logout Button -->
        <button
          class="logout-btn desktop-only"
          on:click={handleLogout}
          aria-label="Logout"
          title={t('logout')}
        >
          <svg class="logout-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </div>
    </div>
  </header>

  <!-- ==========================================
       MOBILE MENU
       ========================================== -->
  {#if isMobileMenuOpen}
    <div class="mobile-menu">
      {#each menuItems as item}
        <button
          class="mobile-menu-item"
          class:active={activeMenuId === item.id}
          on:click={() => navigateTo(item.path)}
        >
          <svg class="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d={item.icon}
            />
          </svg>
          <span class="menu-label">{item.label[$appState.currentLang]}</span>
        </button>
      {/each}
      
      <div class="mobile-menu-divider"></div>
      
      <button class="mobile-menu-item logout" on:click={handleLogout}>
        <svg class="menu-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
        <span class="menu-label">{t('logout')}</span>
      </button>
    </div>
  {/if}

  <!-- ==========================================
       MAIN CONTENT AREA
       ========================================== -->
  <main class="main-content">
    <slot />
  </main>
</div>

<style>
  /* ==========================================
     GLOBAL VARIABLES
     ========================================== */
  :global(:root) {
    --primary: #0f766e;
    --primary-light: #14b8a6;
    --primary-dark: #0d5c54;
    --secondary: #1e293b;
    --bg: #ffffff;
    --bg-alt: #f8fafc;
    --bg-hover: #f1f5f9;
    --border: #e2e8f0;
    --border-dark: #cbd5e1;
    --text: #1e293b;
    --text-muted: #64748b;
    --text-light: #94a3b8;
    --error: #dc2626;
    --warning: #f59e0b;
    --success: #10b981;
    --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
    --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
    --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  }

  /* ==========================================
     RESET & BASE STYLES
     ========================================== */
  :global(*) {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :global(body) {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: var(--bg-alt);
    color: var(--text);
    line-height: 1.6;
    font-size: 14px;
  }

  /* ==========================================
     APP CONTAINER
     ========================================== */
  .app-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  /* ==========================================
     HEADER BAR
     ========================================== */
  .header-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 64px;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
    z-index: 100;
    box-shadow: var(--shadow-sm);
  }

  .header-inner {
    max-width: 100%;
    height: 100%;
    margin: 0 auto;
    padding: 0 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;
  }

  /* ==========================================
     BRAND
     ========================================== */
  .brand {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    font-weight: 700;
    font-size: 1.125rem;
    color: var(--primary);
    user-select: none;
  }

  .logo-container {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, var(--primary), var(--primary-light));
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: var(--shadow-md);
  }

  .logo-container svg {
    width: 24px;
    height: 24px;
    color: white;
  }

  .brand-name {
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--primary);
  }

  /* ==========================================
     NAVIGATION MENU
     ========================================== */
  .nav-menu {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
  }

  .menu-btn {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: var(--text-muted);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .menu-btn:hover {
    background: var(--bg-hover);
    color: var(--primary);
  }

  .menu-btn.active {
    background: var(--primary);
    color: white;
    box-shadow: var(--shadow-md);
  }

  .menu-icon {
    width: 18px;
    height: 18px;
    flex-shrink: 0;
  }

  .menu-label {
    font-size: 0.875rem;
    font-weight: 500;
  }

  /* ==========================================
     USER ZONE
     ========================================== */
  .user-zone {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  /* Language Toggle */
  .lang-toggle-btn {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.5rem 0.75rem;
    background: var(--bg-alt);
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .lang-toggle-btn:hover {
    border-color: var(--primary);
    background: var(--bg);
  }

  .lang-option {
    color: var(--text-light);
    transition: color 0.2s ease;
  }

  .lang-option.active {
    color: var(--primary);
  }

  .lang-divider {
    color: var(--border-dark);
  }

  /* Token Timer */
  .token-timer {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 0.75rem;
    background: var(--bg-alt);
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text);
    font-variant-numeric: tabular-nums;
  }

  .token-timer.warning {
    background: #fef3c7;
    border-color: var(--warning);
    color: var(--warning);
    animation: pulse 1s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
  }

  .timer-icon {
    width: 16px;
    height: 16px;
  }

  /* Logout Button */
  .logout-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .logout-btn:hover {
    background: #fee2e2;
    border-color: var(--error);
    color: var(--error);
  }

  .logout-icon {
    width: 18px;
    height: 18px;
  }

  /* ==========================================
     MOBILE MENU
     ========================================== */
  .mobile-menu-btn {
    display: none;
  }

  .mobile-menu {
    display: none;
  }

  /* ==========================================
     MAIN CONTENT
     ========================================== */
  .main-content {
    margin-top: 64px;
    min-height: calc(100vh - 64px);
    width: 100%;
  }

  /* ==========================================
     RESPONSIVE - MOBILE
     ========================================== */
  @media (max-width: 1024px) {
    .desktop-only {
      display: none !important;
    }

    .mobile-only {
      display: flex !important;
    }

    .mobile-menu-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      background: transparent;
      border: 1px solid var(--border);
      border-radius: 8px;
      color: var(--text);
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .mobile-menu-btn:hover {
      background: var(--bg-hover);
      border-color: var(--primary);
      color: var(--primary);
    }

    .mobile-menu {
      display: flex;
      flex-direction: column;
      position: fixed;
      top: 64px;
      left: 0;
      right: 0;
      background: var(--bg);
      border-bottom: 1px solid var(--border);
      box-shadow: var(--shadow-lg);
      z-index: 99;
      max-height: calc(100vh - 64px);
      overflow-y: auto;
    }

    .mobile-menu-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.5rem;
      background: transparent;
      border: none;
      border-bottom: 1px solid var(--border);
      color: var(--text);
      font-size: 1rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s ease;
      text-align: left;
    }

    .mobile-menu-item:hover {
      background: var(--bg-hover);
    }

    .mobile-menu-item.active {
      background: var(--primary);
      color: white;
    }

    .mobile-menu-item.logout {
      color: var(--error);
    }

    .mobile-menu-item.logout:hover {
      background: #fee2e2;
    }

    .mobile-menu-divider {
      height: 8px;
      background: var(--bg-alt);
      border-bottom: 1px solid var(--border);
    }

    .header-inner {
      padding: 0 1rem;
    }
  }

  @media (max-width: 640px) {
    .brand-name {
      font-size: 1rem;
    }

    .token-timer span {
      display: none;
    }
  }
</style>