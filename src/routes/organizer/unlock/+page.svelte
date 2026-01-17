<script lang="ts">
  import axios from 'axios';
  
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
      unlockAccount: "ปลดล็อคบัญชี",
      enterEmailToRestore: "กรอกอีเมลเพื่อกู้คืนการเข้าถึงบัญชี",
      userEmailAddress: "อีเมลของผู้ใช้",
      enterEmailPlaceholder: "กรอกอีเมล",
      processing: "กำลังดำเนินการ...",
      emailRequired: "กรุณากรอกอีเมล",
      invalidEmail: "รูปแบบอีเมลไม่ถูกต้อง",
      accountNotFound: "ไม่พบบัญชีนี้",
      accountUnlocked: "ปลดล็อคบัญชีสำเร็จ",
      unlockEmailSent: "ส่งลิงก์ปลดล็อคไปยังอีเมลแล้ว",
      error: "เกิดข้อผิดพลาด",
    },
    en: {
      unlockAccount: "Unlock Account",
      enterEmailToRestore: "Enter email to restore access to your account",
      userEmailAddress: "User Email Address",
      enterEmailPlaceholder: "Enter email",
      processing: "Processing...",
      emailRequired: "Please enter email",
      invalidEmail: "Invalid email format",
      accountNotFound: "Account not found",
      accountUnlocked: "Account unlocked successfully",
      unlockEmailSent: "Unlock link sent to email",
      error: "Error occurred",
    },
  };
  
  $: lang = translations[currentLang];
  
  // State
  let email = "";
  let isLoading = false;
  let notificationMessage = "";
  let notificationType: "success" | "error" = "error";
  let errorField = "";
  
  // Functions
  function clearNotification() {
    notificationMessage = "";
    errorField = "";
  }
  
  function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  async function handleUnlock(event: Event) {
    event.preventDefault();
    clearNotification();
    
    // Validation
    if (!email.trim()) {
      notificationMessage = lang.emailRequired;
      notificationType = "error";
      errorField = "email";
      return;
    }
    
    if (!validateEmail(email)) {
      notificationMessage = lang.invalidEmail;
      notificationType = "error";
      errorField = "email";
      return;
    }
    
    isLoading = true;
    
    try {
      const response = await api.post('/api/auth/unlock', {
        email: email.trim()
      });
      
      // Success
      notificationMessage = lang.unlockEmailSent;
      notificationType = "success";
      email = "";
      
      // Optional: Show success message for longer
      setTimeout(() => {
        notificationMessage = "";
      }, 5000);
      
    } catch (error: any) {
      console.error('Unlock error:', error);
      
      if (error.response?.status === 404) {
        notificationMessage = lang.accountNotFound;
      } else {
        notificationMessage = error.response?.data?.message || lang.error;
      }
      
      notificationType = "error";
      errorField = "email";
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="unlock-user-component">
  <div class="unlock-card">
    <!-- Header -->
    <div class="unlock-card-header">
      <div class="unlock-icon-circle">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
        </svg>
      </div>
      <h2 class="unlock-main-title">{lang.unlockAccount}</h2>
      <p class="unlock-sub-title">{lang.enterEmailToRestore}</p>
    </div>

    <!-- Form -->
    <form class="unlock-form-section" on:submit|preventDefault={handleUnlock} autocomplete="off">
      <div class="unlock-form-group">
        <label class="unlock-label" for="unlock-email-input">{lang.userEmailAddress}</label>
        <div class="unlock-input-wrapper" class:unlock-error={errorField === 'email'}>
          <input
            id="unlock-email-input"
            type="email"
            placeholder={lang.enterEmailPlaceholder}
            bind:value={email}
            on:input={clearNotification}
            disabled={isLoading}
          />
        </div>
      </div>

      <!-- Notification -->
      {#if notificationMessage}
        <div class="unlock-notification unlock-{notificationType}">
          <div class="unlock-notif-icon">
            {#if notificationType === "error"}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            {:else}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            {/if}
          </div>
          <span>{notificationMessage}</span>
        </div>
      {/if}

      <!-- Submit Button -->
      <button type="submit" class="unlock-submit-btn" disabled={isLoading}>
        {#if isLoading}
          <div class="unlock-spinner"></div>
          <span>{lang.processing}</span>
        {:else}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <span>{lang.unlockAccount}</span>
        {/if}
      </button>
    </form>
  </div>
</div>

<style>
  /* WRAPPER */
  .unlock-user-component {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  }

  /* CARD */
  .unlock-card {
    width: 100%;
    max-width: 480px;
    background: rgba(30, 41, 59, 0.8);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 24px;
    padding: 3rem 2.5rem;
    box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
    animation: slideUp 0.5s ease-out;
  }

  /* HEADER */
  .unlock-card-header {
    text-align: center;
    margin-bottom: 2.5rem;
  }

  .unlock-icon-circle {
    width: 80px;
    height: 80px;
    margin: 0 auto 1.5rem;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.1));
    border: 2px solid rgba(16, 185, 129, 0.3);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    animation: pulse-ring 2s infinite;
  }

  .unlock-icon-circle svg {
    color: #10b981;
  }

  .unlock-main-title {
    font-size: 2rem;
    font-weight: 700;
    color: #f8fafc;
    margin: 0 0 0.75rem 0;
    background: linear-gradient(135deg, #10b981, #14b8a6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .unlock-sub-title {
    font-size: 0.95rem;
    color: #94a3b8;
    margin: 0;
    line-height: 1.5;
  }

  /* FORM */
  .unlock-form-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .unlock-form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .unlock-label {
    font-size: 0.95rem;
    font-weight: 600;
    color: #f8fafc;
  }

  .unlock-input-wrapper {
    position: relative;
  }

  .unlock-input-wrapper input {
    width: 100%;
    padding: 1rem 1.25rem;
    background: rgba(15, 23, 42, 0.6);
    border: 2px solid rgba(255, 255, 255, 0.1);
    border-radius: 14px;
    color: #f8fafc;
    font-size: 1rem;
    transition: all 0.3s;
  }

  .unlock-input-wrapper input::placeholder {
    color: #64748b;
  }

  .unlock-input-wrapper input:focus {
    outline: none;
    border-color: #10b981;
    background: rgba(15, 23, 42, 0.8);
    box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
  }

  .unlock-input-wrapper.unlock-error input {
    border-color: #ef4444;
    background: rgba(239, 68, 68, 0.05);
  }

  .unlock-input-wrapper.unlock-error input:focus {
    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.1);
  }

  .unlock-input-wrapper input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  /* NOTIFICATION */
  .unlock-notification {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    border-radius: 14px;
    font-size: 0.95rem;
    font-weight: 500;
    animation: slideDown 0.3s ease-out;
  }

  .unlock-notification.unlock-error {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
  }

  .unlock-notification.unlock-success {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid rgba(16, 185, 129, 0.3);
    color: #10b981;
  }

  .unlock-notif-icon {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .unlock-notification.unlock-error .unlock-notif-icon {
    color: #ef4444;
  }

  .unlock-notification.unlock-success .unlock-notif-icon {
    color: #10b981;
  }

  /* SUBMIT BUTTON */
  .unlock-submit-btn {
    width: 100%;
    padding: 1.125rem 1.5rem;
    background: linear-gradient(135deg, #10b981, #059669);
    border: none;
    border-radius: 14px;
    color: white;
    font-size: 1rem;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
  }

  .unlock-submit-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 28px rgba(16, 185, 129, 0.4);
  }

  .unlock-submit-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .unlock-submit-btn:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }

  /* SPINNER */
  .unlock-spinner {
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }

  /* ANIMATIONS */
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

  @keyframes pulse-ring {
    0%, 100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.05);
      opacity: 0.9;
    }
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  /* RESPONSIVE */
  @media (max-width: 640px) {
    .unlock-user-component {
      padding: 1.5rem 1rem;
    }

    .unlock-card {
      padding: 2.5rem 2rem;
    }

    .unlock-main-title {
      font-size: 1.75rem;
    }

    .unlock-icon-circle {
      width: 70px;
      height: 70px;
    }

    .unlock-icon-circle svg {
      width: 28px;
      height: 28px;
    }
  }

  @media (max-width: 480px) {
    .unlock-card {
      padding: 2rem 1.5rem;
    }

    .unlock-main-title {
      font-size: 1.5rem;
    }

    .unlock-sub-title {
      font-size: 0.875rem;
    }

    .unlock-input-wrapper input {
      padding: 0.875rem 1rem;
      font-size: 0.95rem;
    }

    .unlock-submit-btn {
      padding: 1rem 1.25rem;
      font-size: 0.95rem;
    }
  }
</style>