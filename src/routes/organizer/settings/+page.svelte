<script lang="ts">
  import { onMount } from 'svelte';
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
      accountSettings: "ตั้งค่าบัญชี",
      manageProfile: "จัดการข้อมูลส่วนตัวและการตั้งค่า",
      personalInfo: "ข้อมูลส่วนตัว",
      academicInfo: "ข้อมูลการศึกษา",
      departmentInfo: "ข้อมูลหน่วยงาน",
      preferenceSettings: "การตั้งค่า",
      title: "คำนำหน้า",
      firstName: "ชื่อ",
      lastName: "นามสกุล",
      emailAddress: "อีเมล",
      studentId: "รหัสนิสิต",
      faculty: "คณะ",
      department: "ภาควิชา",
      year: "ชั้นปี",
      organization: "หน่วยงาน",
      position: "ตำแหน่ง",
      language: "ภาษา",
      thai: "ไทย",
      english: "English",
      saveChanges: "บันทึกการเปลี่ยนแปลง",
      saving: "กำลังบันทึก...",
      enterFirstName: "กรุณากรอกชื่อ",
      enterLastName: "กรุณากรอกนามสกุล",
      selectFaculty: "เลือกคณะ",
      selectDepartment: "เลือกภาควิชา",
      selectYear: "เลือกชั้นปี",
      enterOrganization: "กรุณากรอกหน่วยงาน",
      enterPosition: "กรุณากรอกตำแหน่ง",
      profileUpdated: "อัปเดตโปรไฟล์สำเร็จ!",
      updateFailed: "ไม่สามารถอัปเดตโปรไฟล์ได้",
      pleaseComplete: "กรุณากรอกข้อมูลให้ครบถ้วน",
    },
    en: {
      accountSettings: "Account Settings",
      manageProfile: "Manage your personal information and preferences",
      personalInfo: "Personal Information",
      academicInfo: "Academic Information",
      departmentInfo: "Department Information",
      preferenceSettings: "Preferences",
      title: "Title",
      firstName: "First Name",
      lastName: "Last Name",
      emailAddress: "Email Address",
      studentId: "Student ID",
      faculty: "Faculty",
      department: "Department",
      year: "Year",
      organization: "Organization",
      position: "Position",
      language: "Language",
      thai: "Thai",
      english: "English",
      saveChanges: "Save Changes",
      saving: "Saving...",
      enterFirstName: "Enter first name",
      enterLastName: "Enter last name",
      selectFaculty: "Select faculty",
      selectDepartment: "Select department",
      selectYear: "Select year",
      enterOrganization: "Enter organization",
      enterPosition: "Enter position",
      profileUpdated: "Profile updated successfully!",
      updateFailed: "Failed to update profile",
      pleaseComplete: "Please complete all required fields",
    },
  };
  
  $: lang = translations[currentLang];
  
  // User Data
  let userRole: "student" | "organizer" = "student";
  let userEmail = "";
  let userTitle = "";
  let userFirstName = "";
  let userLastName = "";
  let studentIdNumber = "";
  let userFaculty = "";
  let userDepartment = "";
  let userYear = "";
  let userOrganization = "";
  let userPosition = "";
  
  // UI State
  let loading = false;
  let saving = false;
  let showTitleDropdown = false;
  let showFacultyDropdown = false;
  let showDepartmentDropdown = false;
  let showYearDropdown = false;
  
  // Validation
  let fieldValidationErrors: Record<string, boolean> = {};
  
  // Options
  const nameTitles = ["นาย", "นาง", "นางสาว", "Mr.", "Mrs.", "Ms."];
  
  const faculties = [
    { code: "01", name: "คณะวิศวกรรมศาสตร์" },
    { code: "02", name: "คณะศึกษาศาสตร์" },
    { code: "03", name: "คณะวิทยาศาสตร์" },
    { code: "21", name: "คณะเกษตร กำแพงแสน" },
    { code: "22", name: "คณะบริหารธุรกิจ" },
    { code: "25", name: "คณะสัตวแพทยศาสตร์" },
    { code: "30", name: "คณะสถาปัตยกรรมศาสตร์" },
    { code: "33", name: "คณะมนุษยศาสตร์" },
    { code: "40", name: "คณะเศรษฐศาสตร์" },
    { code: "51", name: "คณะสังคมศาสตร์" },
  ];
  
  const departments: Record<string, string[]> = {
    "01": ["วิศวกรรมโยธา", "วิศวกรรมไฟฟ้า", "วิศวกรรมเครื่องกล", "วิศวกรรมคอมพิวเตอร์"],
    "02": ["การศึกษาปฐมวัย", "การประถมศึกษา", "การมัธยมศึกษา"],
    "03": ["คณิตศาสตร์", "ฟิสิกส์", "เคมี", "ชีววิทยา", "วิทยาการคอมพิวเตอร์"],
  };
  
  const years = ["1", "2", "3", "4", "5", "6"];
  
  // Helper Functions
  function retrieveFacultyName(code: string): string {
    if (!code) return lang.selectFaculty;
    const faculty = faculties.find(f => f.code === code);
    return faculty ? faculty.name : lang.selectFaculty;
  }
  
  function toggleDropdownVisibility(dropdown: string, event?: Event) {
    if (event) event.stopPropagation();
    
    showTitleDropdown = dropdown === "title" ? !showTitleDropdown : false;
    showFacultyDropdown = dropdown === "faculty" ? !showFacultyDropdown : false;
    showDepartmentDropdown = dropdown === "department" ? !showDepartmentDropdown : false;
    showYearDropdown = dropdown === "year" ? !showYearDropdown : false;
  }
  
  function chooseTitle(title: string) {
    userTitle = title;
    showTitleDropdown = false;
    dismissAlert();
  }
  
  function chooseFaculty(faculty: { code: string; name: string }) {
    userFaculty = faculty.code;
    userDepartment = "";
    showFacultyDropdown = false;
    dismissAlert();
  }
  
  function chooseDepartment(dept: string) {
    userDepartment = dept;
    showDepartmentDropdown = false;
    dismissAlert();
  }
  
  function chooseYear(year: string) {
    userYear = year;
    showYearDropdown = false;
    dismissAlert();
  }
  
  function dismissAlert() {
    fieldValidationErrors = {};
  }
  
  function closeAllDropdowns() {
    showTitleDropdown = false;
    showFacultyDropdown = false;
    showDepartmentDropdown = false;
    showYearDropdown = false;
  }
  
  // Data Loading
  async function loadUserProfile() {
    loading = true;
    try {
      const response = await api.get('/api/user/profile');
      const data = response.data;
      
      userRole = data.role || "student";
      userEmail = data.email || "";
      userTitle = data.title || "";
      userFirstName = data.firstName || "";
      userLastName = data.lastName || "";
      studentIdNumber = data.studentId || "";
      userFaculty = data.faculty || "";
      userDepartment = data.department || "";
      userYear = data.year || "";
      userOrganization = data.organization || "";
      userPosition = data.position || "";
      
    } catch (error) {
      console.error('Failed to load profile:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load profile data',
        timer: 2000
      });
    } finally {
      loading = false;
    }
  }
  
  // Validation
  function validateForm(): boolean {
    const errors: Record<string, boolean> = {};
    
    if (!userTitle) errors.title = true;
    if (!userFirstName.trim()) errors.firstName = true;
    if (!userLastName.trim()) errors.lastName = true;
    
    if (userRole === "student") {
      if (!userFaculty) errors.faculty = true;
      if (!userDepartment) errors.department = true;
      if (!userYear) errors.year = true;
    } else {
      if (!userOrganization.trim()) errors.organization = true;
      if (!userPosition.trim()) errors.position = true;
    }
    
    fieldValidationErrors = errors;
    return Object.keys(errors).length === 0;
  }
  
  // Save Profile
  async function saveProfile() {
    if (!validateForm()) {
      Swal.fire({
        icon: 'warning',
        title: lang.pleaseComplete,
        timer: 2000
      });
      return;
    }
    
    saving = true;
    try {
      const payload: any = {
        title: userTitle,
        firstName: userFirstName,
        lastName: userLastName,
      };
      
      if (userRole === "student") {
        payload.faculty = userFaculty;
        payload.department = userDepartment;
        payload.year = userYear;
      } else {
        payload.organization = userOrganization;
        payload.position = userPosition;
      }
      
      await api.put('/api/user/profile', payload);
      
      Swal.fire({
        icon: 'success',
        title: lang.profileUpdated,
        timer: 1500
      });
      
    } catch (error) {
      console.error('Save profile error:', error);
      Swal.fire({
        icon: 'error',
        title: lang.updateFailed,
        timer: 2000
      });
    } finally {
      saving = false;
    }
  }
  
  // Language Toggle
  function toggleLanguage() {
    currentLang = currentLang === "th" ? "en" : "th";
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("app_language", currentLang);
    }
  }
  
  onMount(() => {
    loadUserProfile();
  });
</script>

<svelte:window on:click={closeAllDropdowns} />


<!-- ==================== HTML SECTION ==================== -->

        <div class="settings-container">
          {#if dataIsLoading}
            <div class="loading-state">
              <div class="loader"></div>
              <p>Loading your profile...</p>
            </div>
          {:else}
            <div class="settings-content">
              <!-- Header Section -->
              <div class="header-section">
                <div class="icon-wrapper">
                  <svg
                    width="28"
                    height="28"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div class="header-text">
                  <h1>{lang.accountSettings}</h1>
                  <p>{lang.manageProfile}</p>
                </div>
              </div>

              <!-- Personal Information Card -->
              <div class="info-card">
                <div class="card-headerr">
                  <div class="card-icon">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"
                      ></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                  </div>
                  <h2>{lang.personalInfo}</h2>
                </div>

                <div class="card-content">
                  <!-- Title & First Name Row -->
                  <div class="field-row">
                    <div class="form-field" style="flex: 0 0 100px;">
                      <label for="date-from">{lang.title}</label>
                      <div class="custom-select">
                        <button
                          type="button"
                          class="select-btn {fieldValidationErrors.title
                            ? 'error'
                            : ''}"
                          class:active={showTitleDropdown}
                          on:click={(e) => toggleDropdownVisibility("title", e)}
                        >
                          <span class:placeholder={!userTitle}
                            >{userTitle || lang.title}</span
                          >
                          <svg
                            class="arrow"
                            class:rotate={showTitleDropdown}
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                          >
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </button>
                        {#if showTitleDropdown}
                          <div class="dropdown-menu">
                            {#each nameTitles as title}
                              <button
                                class="dropdown-item"
                                on:click={() => chooseTitle(title)}
                              >
                                {title}
                              </button>
                            {/each}
                          </div>
                        {/if}
                      </div>
                    </div>

                    <div class="form-field" style="flex: 1;">
                      <label for="date-from">{lang.firstName}</label>
                      <div
                        class="input-wrapper {fieldValidationErrors.firstName
                          ? 'error'
                          : ''}"
                      >
                        <input
                          type="text"
                          bind:value={userFirstName}
                          on:input={dismissAlert}
                          placeholder={lang.enterFirstName}
                        />
                      </div>
                    </div>
                  </div>

                  <!-- Last Name -->
                  <div class="form-field">
                    <label for="date-from">{lang.lastName}</label>
                    <div
                      class="input-wrapper {fieldValidationErrors.lastName
                        ? 'error'
                        : ''}"
                    >
                      <input
                        type="text"
                        bind:value={userLastName}
                        on:input={dismissAlert}
                        placeholder={lang.enterLastName}
                      />
                    </div>
                  </div>

                  <!-- Email (Locked) -->
                  <div class="form-field">
                    <label for="date-from">{lang.emailAddress}</label>
                    <div class="input-wrapper locked">
                      <input type="email" value={userEmail} disabled />
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"
                        ></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Role-Specific Information Card -->
              <div class="info-card" style="position: relative; z-index: 50;">
                <div class="card-headerr">
                  <div class="card-icon">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      {#if userRole === "student"}
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"></path>
                        <path d="M6 12v5c3 3 9 3 12 0v-5"></path>
                      {:else}
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"
                        ></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                      {/if}
                    </svg>
                  </div>
                  <h2>
                    {userRole === "student"
                      ? lang.academicInfo
                      : lang.departmentInfo}
                  </h2>
                </div>

                <div class="card-content">
                  {#if userRole === "student"}
                    <!-- Nisit ID (Locked) -->
                    <div class="form-field">
                      <label for="date-from">{lang.studentId}</label>
                      <div class="input-wrapper locked">
                        <input type="text" value={studentIdNumber} disabled />
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          <rect
                            x="3"
                            y="11"
                            width="18"
                            height="11"
                            rx="2"
                            ry="2"
                          ></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                      </div>
                    </div>

                    <!-- Faculty -->
                    <div class="form-field">
                      <label for="date-from">{lang.faculty}</label>
                      <div class="custom-select">
                        <button
                          type="button"
                          class="select-btn {fieldValidationErrors.faculty
                            ? 'error'
                            : ''}"
                          class:active={showFacultyDropdown}
                          on:click={(e) =>
                            toggleDropdownVisibility("faculty", e)}
                        >
                          <span class:placeholder={!userFaculty}
                            >{retrieveFacultyName(userFaculty)}</span
                          >
                          <svg
                            class="arrow"
                            class:rotate={showFacultyDropdown}
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                          >
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </button>
                        {#if showFacultyDropdown}
                          <div class="dropdown-menu">
                            {#each universityFaculties as faculty}
                              <button
                                class="dropdown-item"
                                on:click={() => chooseFaculty(faculty.id)}
                              >
                                {faculty.name}
                              </button>
                            {/each}
                          </div>
                        {/if}
                      </div>
                    </div>

                    <!-- Major -->
                    <div class="form-field">
                      <label for="date-from">{lang.major}</label>
                      <div class="custom-select" class:disabled={!userFaculty}>
                        <button
                          type="button"
                          class="select-btn {fieldValidationErrors.major
                            ? 'error'
                            : ''}"
                          class:active={showMajorDropdown}
                          class:placeholder={!userMajor}
                          disabled={!userFaculty}
                          on:click={(e) => {
                            if (userFaculty)
                              toggleDropdownVisibility("major", e);
                          }}
                        >
                          <span class:placeholder={!userMajor}
                            >{retrieveMajorName(userMajor)}</span
                          >
                          <svg
                            class="arrow"
                            class:rotate={showMajorDropdown}
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                          >
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </button>
                        {#if showMajorDropdown}
                          <div class="dropdown-menu">
                            {#each availableMajorsForFaculty as major}
                              <button
                                class="dropdown-item"
                                on:click={() => chooseMajor(major.id)}
                              >
                                {major.name}
                              </button>
                            {/each}
                          </div>
                        {/if}
                      </div>
                    </div>
                  {:else}
                    <!-- Department -->
                    <div class="form-field">
                      <label for="date-from">{lang.department}</label>
                      <div class="custom-select">
                        <button
                          type="button"
                          class="select-btn {fieldValidationErrors.department
                            ? 'error'
                            : ''}"
                          class:active={showDepartmentDropdown}
                          on:click={(e) => toggleDropdownVisibility("dept", e)}
                        >
                          <span class:placeholder={!userDepartment}
                            >{retrieveDepartmentName(userDepartment)}</span
                          >
                          <svg
                            class="arrow"
                            class:rotate={showDepartmentDropdown}
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                          >
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </button>
                        {#if showDepartmentDropdown}
                          <div class="dropdown-menu">
                            {#each staffDepartments as dept}
                              <button
                                class="dropdown-item"
                                on:click={() => chooseDepartment(dept.id)}
                              >
                                {dept.name}
                              </button>
                            {/each}
                          </div>
                        {/if}
                      </div>
                    </div>
                  {/if}
                </div>
              </div>

              <!-- Security Card -->
              <div class="info-card">
                <div class="card-headerr">
                  <div class="card-icon">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"
                      ></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  </div>
                  <h2>{lang.security}</h2>
                </div>

                <div class="card-content">
                  <div class="form-field">
                    <div class="password-row">
                      <label for="date-from">{lang.password}</label>
                      <a
                        href="/auth/forgot-password?return_to={$page.url
                          .pathname}"
                        class="change-link"
                      >
                        {lang.changePassword}
                      </a>
                    </div>
                    <div class="input-wrapper locked">
                      <input type="password" value="••••••••••••" disabled />
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"
                        ></rect>
                        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Feedback Message -->
              {#if feedbackMessage}
                <div class="feedback-toast {feedbackType}">
                  <div class="toast-icon">
                    {#if feedbackType === "error"}
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                      </svg>
                    {:else}
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    {/if}
                  </div>
                  <span>{feedbackMessage}</span>
                </div>
              {/if}

              <!-- Action Buttons -->
              <div class="action-section">
                <button
                  type="button"
                  class="save-btn"
                  class:disabled={!hasUnsavedChanges || savingChanges}
                  disabled={!hasUnsavedChanges || savingChanges}
                  on:click|preventDefault={submitProfileUpdate}
                >
                  {#if savingChanges}
                    <div class="btn-loader"></div>
                    <span
                      >{currentLang === "th"
                        ? "กำลังบันทึก..."
                        : "Saving Changes..."}</span
                    >
                  {:else}
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                    >
                      <path
                        d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"
                      ></path>
                      <polyline points="17 21 17 13 7 13 7 21"></polyline>
                      <polyline points="7 3 7 8 15 8"></polyline>
                    </svg>
                    <span>{lang.saveChanges}</span>
                  {/if}
                </button>
              </div>
            </div>
          {/if}
        </div>
      {:else if currentView == "unlock"}
        <div class="unlock-user-component">
          <div class="unlock-card">
            <div class="unlock-card-header">
              <div class="unlock-icon-circle">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"
                  ></rect>
                  <path d="M7 11V7a5 5 0 0 1 9.9-1"></path>
                </svg>
              </div>
              <h2 class="unlock-main-title">{lang.unlockAccount}</h2>
              <p class="unlock-sub-title">
                {lang.enterEmailToRestore}
              </p>
            </div>

            <form
              class="unlock-form-section"
              on:submit|preventDefault={handleUnlock}
              autocomplete="off"
            >
              <div class="unlock-form-group">
                <label class="unlock-label" for="unlock-email-input"
                  >{lang.userEmailAddress}</label
                >
                <div
                  class="unlock-input-wrapper {errorField === 'email'
                    ? 'unlock-error'
                    : ''}"
                >
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

              {#if notificationMessage}
                <div class="unlock-notification unlock-{notificationType}">
                  <div class="unlock-notif-icon">
                    {#if notificationType === "error"}
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="12" y1="8" x2="12" y2="12"></line>
                        <line x1="12" y1="16" x2="12.01" y2="16"></line>
                      </svg>
                    {:else}
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    {/if}
                  </div>
                  <span>{notificationMessage}</span>
                </div>
              {/if}

              <button
                type="submit"
                class="unlock-submit-btn"
                disabled={isLoading}
              >
                {#if isLoading}
                  <div class="unlock-spinner"></div>
                  <span
                    >{currentLang === "th"
                      ? "กำลังดำเนินการ..."
                      : "Processing..."}</span
                  >
                {:else}
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"
                    ></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  <span>{lang.unlockAccount}</span>
                {/if}
              </button>
            </form>
          </div>
        </div>
      {:else if currentView !== "create"}
        <div
          style="padding: 4rem; text-align: center; color: var(--text-muted); border: 1px dashed rgba(255,255,255,0.1); border-radius: 20px;"
        >
          <h3>
            Content for {menuItems.find((m) => m.id === currentView)?.label}
          </h3>
          <p>This page does not have search or pagination enabled.</p>
        </div>
      {/if}
    </div>

    <div class="pagination-controls"></div>

    {#if currentView === "create"}
      <div class="ce-wrapper">
        <div
          class="ce-container"
          role="button"
          tabindex="0"
          on:click={() => (ce_activeDropdown = null)}
          on:keydown={(e) => {
            if (e.key === "Escape" || e.key === "Enter")
              ce_activeDropdown = null;
          }}
        >
          <div class="ce-header">
            <h2 class="ce-title">
              {editingEventId ? lang.editEvent : lang.createNewEvent}
            </h2>
            <div class="ce-header-right">
              {#if ce_validationErrors.size > 0}
                <div class="ce-validation-alert">
                  <svg
                    class="ce-alert-icon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <span class="ce-alert-text">{lang.fillAllFields}</span>
                </div>
              {/if}
              <div class="ce-header-actions">
                <button
                  class="ce-btn-cancel"
                  on:click={() => {
                    editingEventId = null;
                    ce_formData = {
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
                      totalSlots: null,
                      distanceKm: null,
                      holidays: [],
                      excludeWeekends: false,
                      holidayType: "none",
                      specificDates: [],
                      tempHoliday: "",
                      totalRewards: null,
                      requiredCompletions: null,
                      rewards: [
                        {
                          name: "",
                          requirement: null,
                        },
                      ],
                      isPublic: true,
                      isActive: true,
                      imagePreview: null,
                      eventType: "single_day",
                      allowDailyCheckin: false,
                      maxCheckinsPerUser: 1,
                    };
                    ce_holidayMode = null;
                    currentView = "list";
                  }}>{lang.cancel}</button
                >
                <button class="ce-btn-save" on:click={ce_submit}
                  >{editingEventId
                    ? lang.update
                    : currentLang === "th"
                      ? "เผยแพร่"
                      : "Publish"}</button
                >
              </div>
            </div>
          </div>

          <div class="ce-grid-layout">
            <!-- Image Upload Section -->
            <div
              class="ce-card ce-img-card"
              class:has-img={ce_formData.imagePreview}
              role="button"
              tabindex="0"
              aria-label="Upload event image"
              on:click|stopPropagation={ce_trigFile}
              on:keydown={(e) => {
                if (e.key === "Enter" || e.key === " ") ce_trigFile();
              }}
            >
              <input
                type="file"
                accept="image/*"
                bind:this={ce_fileInput}
                on:change={ce_handleImg}
                hidden
              />
              {#if ce_formData.imagePreview}
                <img
                  src={ce_formData.imagePreview}
                  alt="Preview"
                  class="ce-preview-img"
                />
                <div class="ce-overlay">
                  <span
                    >{currentLang === "th"
                      ? "เปลี่ยนรูปภาพ"
                      : "Change Image"}</span
                  >
                </div>
              {:else}
                <div class="ce-upload-placeholder">
                  <div class="ce-icon-upload">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      ></path>
                    </svg>
                  </div>
                  <span
                    >{currentLang === "th"
                      ? "อัพโหลดแบนเนอร์กิจกรรม"
                      : "Upload Event Banner"}</span
                  >
                </div>
              {/if}
            </div>

            <!-- Basic Info -->
            <div class="ce-card ce-form-card">
              <div class="ce-card-head">
                <svg
                  class="ce-icon-svg"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  ></path>
                </svg>
                <span
                  >{currentLang === "th"
                    ? "ข้อมูลพื้นฐาน"
                    : "Basic Information"}</span
                >
              </div>

              <div class="ce-input-group">
                <label for="event-title"
                  >{lang.eventName} <span class="ce-req">*</span></label
                >
                <input
                  id="event-title"
                  type="text"
                  bind:value={ce_formData.title}
                  placeholder={currentLang === "th"
                    ? "ชื่อกิจกรรมอย่างเป็นทางการ"
                    : "Official Event Name"}
                  class="ce-input"
                  class:error={ce_validationErrors.has("title")}
                />
              </div>

              <div class="ce-input-group">
                <label for="event-desc"
                  >{lang.description} <span class="ce-req">*</span></label
                >
                <textarea
                  id="event-desc"
                  bind:value={ce_formData.description}
                  placeholder={currentLang === "th"
                    ? "รายละเอียดกิจกรรม..."
                    : "Event details..."}
                  class="ce-textarea"
                  class:error={ce_validationErrors.has("description")}
                ></textarea>
              </div>

              <div class="ce-input-group">
                <label for="event-location"
                  >{lang.location} <span class="ce-req">*</span></label
                >
                <input
                  id="event-location"
                  type="text"
                  bind:value={ce_formData.location}
                  placeholder={currentLang === "th"
                    ? "สถานที่จัดกิจกรรม"
                    : "Location"}
                  class="ce-input"
                  class:error={ce_validationErrors.has("location")}
                />
              </div>
            </div>

            <!-- Event Type -->
            <div class="ce-card ce-config-card">
              <div class="ce-card-head">
                <svg
                  class="ce-icon-svg"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                  ></path>
                </svg>
                <span>{lang.eventTypeTitle}</span>
              </div>

              <div class="ce-event-type-control">
                <div class="ce-event-type-buttons">
                  <button
                    type="button"
                    class="ce-event-type-btn"
                    class:active={ce_formData.eventType === "single_day"}
                    on:click={() => ce_setEventType("single_day")}
                  >
                    <div class="ce-event-type-icon">
                      <svg
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
                    </div>
                    <div class="ce-event-type-content">
                      <span class="ce-event-type-title">{lang.singleDay}</span>
                      <span class="ce-event-type-desc"
                        >{lang.singleDayDesc}</span
                      >
                    </div>
                    {#if ce_formData.eventType === "single_day"}
                      <div class="ce-event-type-check">
                        <svg
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M5 13l4 4L19 7"
                          ></path>
                        </svg>
                      </div>
                    {/if}
                  </button>

                  <button
                    type="button"
                    class="ce-event-type-btn"
                    class:active={ce_formData.eventType === "multi_day"}
                    on:click={() => ce_setEventType("multi_day")}
                  >
                    <div class="ce-event-type-icon">
                      <svg
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2zM9 12h.01M15 12h.01M9 16h.01M15 16h.01"
                        ></path>
                      </svg>
                    </div>
                    <div class="ce-event-type-content">
                      <span class="ce-event-type-title">{lang.multiDay}</span>
                      <span class="ce-event-type-desc">{lang.multiDayDesc}</span
                      >
                    </div>
                    {#if ce_formData.eventType === "multi_day"}
                      <div class="ce-event-type-check">
                        <svg
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M5 13l4 4L19 7"
                          ></path>
                        </svg>
                      </div>
                    {/if}
                  </button>
                </div>

                {#if ce_formData.eventType === "multi_day"}
                  <div class="ce-checkin-section">
                    <span class="ce-checkin-label"
                      >{lang.maxCheckinsPerUser}</span
                    >
                    <div class="ce-checkin-stepper">
                      <button
                        type="button"
                        class="ce-stepper-btn minus"
                        aria-label="Decrease"
                        on:click={() => {
                          if (ce_formData.maxCheckinsPerUser > 1) {
                            ce_formData.maxCheckinsPerUser--;
                            ce_formData = { ...ce_formData };
                          }
                        }}
                        disabled={ce_formData.maxCheckinsPerUser <= 1}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M18 12H6"
                          ></path>
                        </svg>
                      </button>
                      <div class="ce-stepper-value">
                        {ce_formData.maxCheckinsPerUser}
                      </div>
                      <button
                        type="button"
                        class="ce-stepper-btn plus"
                        aria-label="Increase"
                        on:click={() => {
                          if (ce_formData.maxCheckinsPerUser < 365) {
                            ce_formData.maxCheckinsPerUser++;
                            ce_formData = { ...ce_formData };
                          }
                        }}
                        disabled={ce_formData.maxCheckinsPerUser >= 365}
                      >
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M12 6v12m6-6H6"
                          ></path>
                        </svg>
                      </button>
                      <span class="ce-stepper-unit">{lang.checkinTimes}</span>
                    </div>
                  </div>
                {/if}
              </div>
            </div>

            <!-- Date & Time -->
            <div class="ce-card ce-config-card">
              <div class="ce-card-head">
                <svg
                  class="ce-icon-svg"
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
                <span>{lang.dateAndTime}</span>
              </div>

              <div class="ce-dual-row">
                <div class="ce-input-group">
                  <label for="ce-sDay-input"
                    >{lang.startDateLabel} <span class="ce-req">*</span></label
                  >

                  <div
                    class="ce-date-row compact-gap"
                    class:error={ce_validationErrors.has("startDate")}
                  >
                    <div class="ce-dd-wrap flex-1-5">
                      <div
                        class="ce-trigger"
                        role="button"
                        tabindex="0"
                        aria-haspopup="listbox"
                        aria-expanded={ce_activeDropdown === "sDay"}
                        on:click|stopPropagation={() => ce_toggleDD("sDay")}
                        on:keydown={(e) => {
                          if (["Enter", " "].includes(e.key)) {
                            e.preventDefault();
                            ce_toggleDD("sDay");
                          }
                        }}
                      >
                        <input
                          id="ce-sDay-input"
                          type="text"
                          value={ce_formData.sDay}
                          placeholder={ce_dayPlaceholder}
                          class="ce-input-dis"
                          readonly
                          tabindex="-1"
                          on:click|stopPropagation
                        />
                        <span class="ce-arrow">▼</span>
                      </div>
                      {#if ce_activeDropdown === "sDay"}
                        <div
                          class="ce-options"
                          role="listbox"
                          tabindex="-1"
                          on:click|stopPropagation={() => {}}
                          on:keydown|stopPropagation={() => {}}
                        >
                          {#each ce_days as d}
                            <button
                              type="button"
                              class="ce-opt"
                              role="option"
                              aria-selected={ce_formData.sDay === String(d)}
                              on:click|stopPropagation={() =>
                                ce_selectOpt("sDay", d)}
                            >
                              {d}
                            </button>
                          {/each}
                        </div>
                      {/if}
                    </div>

                    <div class="ce-dd-wrap flex-2">
                      <div
                        class="ce-trigger"
                        role="button"
                        tabindex="0"
                        aria-haspopup="listbox"
                        on:click|stopPropagation={() => ce_toggleDD("sMonth")}
                        on:keydown={(e) => {
                          if (["Enter", " "].includes(e.key)) {
                            e.preventDefault();
                            ce_toggleDD("sMonth");
                          }
                        }}
                      >
                        <input
                          type="text"
                          value={translateMonth(ce_formData.sMonth)}
                          placeholder={ce_monthPlaceholder}
                          class="ce-input-dis"
                          readonly
                          tabindex="-1"
                          on:click|stopPropagation
                        />
                        <span class="ce-arrow">▼</span>
                      </div>
                      {#if ce_activeDropdown === "sMonth"}
                        <div
                          class="ce-options"
                          role="listbox"
                          tabindex="-1"
                          on:click|stopPropagation={() => {}}
                          on:keydown|stopPropagation={() => {}}
                        >
                          {#each ce_months as m, idx}
                            <button
                              type="button"
                              class="ce-opt"
                              role="option"
                              aria-selected={ce_formData.sMonth === m}
                              on:click|stopPropagation={() =>
                                ce_selectOpt("sMonth", m)}
                            >
                              {ce_displayMonths[idx]}
                            </button>
                          {/each}
                        </div>
                      {/if}
                    </div>

                    <div class="ce-dd-wrap flex-1-5">
                      <div
                        class="ce-trigger"
                        role="button"
                        tabindex="0"
                        aria-haspopup="listbox"
                        on:click|stopPropagation={() => ce_toggleDD("sYear")}
                        on:keydown={(e) => {
                          if (["Enter", " "].includes(e.key)) {
                            e.preventDefault();
                            ce_toggleDD("sYear");
                          }
                        }}
                      >
                        <input
                          type="text"
                          value={ce_displaySYear}
                          placeholder={ce_yearPlaceholder}
                          class="ce-input-dis"
                          readonly
                          tabindex="-1"
                          on:click|stopPropagation
                        />
                        <span class="ce-arrow">▼</span>
                      </div>
                      {#if ce_activeDropdown === "sYear"}
                        <div
                          class="ce-options"
                          role="listbox"
                          tabindex="-1"
                          on:click|stopPropagation={() => {}}
                          on:keydown|stopPropagation={() => {}}
                        >
                          {#each ce_displayYears as displayY, idx}
                            <button
                              type="button"
                              class="ce-opt"
                              role="option"
                              aria-selected={ce_formData.sYear === ce_years[idx].toString()}
                              on:click|stopPropagation={() =>
                                ce_selectOpt("sYear", ce_years[idx])}
                            >
                              {displayY}
                            </button>
                          {/each}
                        </div>
                      {/if}
                    </div>
                  </div>
                </div>

                <div class="ce-input-group">
                  <label for="ce-eDay-input"
                    >{lang.endDateLabel} <span class="ce-req">*</span></label
                  >
                  <div
                    class="ce-date-row compact-gap"
                    class:error={ce_validationErrors.has("endDate")}
                  >
                    <div class="ce-dd-wrap flex-1-5">
                      <div
                        class="ce-trigger"
                        role="button"
                        tabindex="0"
                        aria-haspopup="listbox"
                        on:click|stopPropagation={() => ce_toggleDD("eDay")}
                        on:keydown={(e) => {
                          if (["Enter", " "].includes(e.key)) {
                            e.preventDefault();
                            ce_toggleDD("eDay");
                          }
                        }}
                      >
                        <input
                          id="ce-eDay-input"
                          type="text"
                          value={ce_formData.eDay}
                          placeholder={ce_dayPlaceholder}
                          class="ce-input-dis"
                          readonly
                          tabindex="-1"
                          on:click|stopPropagation
                        />
                        <span class="ce-arrow">▼</span>
                      </div>
                      {#if ce_activeDropdown === "eDay"}
                        <div
                          class="ce-options"
                          role="listbox"
                          tabindex="-1"
                          on:click|stopPropagation={() => {}}
                          on:keydown|stopPropagation={() => {}}
                        >
                          {#each ce_days as d}
                            <button
                              type="button"
                              class="ce-opt"
                              role="option"
                              aria-selected={ce_formData.eDay === String(d)}
                              on:click|stopPropagation={() =>
                                ce_selectOpt("eDay", d)}
                            >
                              {d}
                            </button>
                          {/each}
                        </div>
                      {/if}
                    </div>

                    <div class="ce-dd-wrap flex-2">
                      <div
                        class="ce-trigger"
                        role="button"
                        tabindex="0"
                        aria-haspopup="listbox"
                        on:click|stopPropagation={() => ce_toggleDD("eMonth")}
                        on:keydown={(e) => {
                          if (["Enter", " "].includes(e.key)) {
                            e.preventDefault();
                            ce_toggleDD("eMonth");
                          }
                        }}
                      >
                        <input
                          type="text"
                          value={translateMonth(ce_formData.eMonth)}
                          placeholder={ce_monthPlaceholder}
                          class="ce-input-dis"
                          readonly
                          tabindex="-1"
                          on:click|stopPropagation
                        />
                        <span class="ce-arrow">▼</span>
                      </div>
                      {#if ce_activeDropdown === "eMonth"}
                        <div
                          class="ce-options"
                          role="listbox"
                          tabindex="-1"
                          on:click|stopPropagation={() => {}}
                          on:keydown|stopPropagation={() => {}}
                        >
                          {#each ce_months as m, idx}
                            <button
                              type="button"
                              class="ce-opt"
                              role="option"
                              aria-selected={ce_formData.eMonth === m}
                              on:click|stopPropagation={() =>
                                ce_selectOpt("eMonth", m)}
                            >
                              {ce_displayMonths[idx]}
                            </button>
                          {/each}
                        </div>
                      {/if}
                    </div>

                    <div class="ce-dd-wrap flex-1-5">
                      <div
                        class="ce-trigger"
                        role="button"
                        tabindex="0"
                        aria-haspopup="listbox"
                        on:click|stopPropagation={() => ce_toggleDD("eYear")}
                        on:keydown={(e) => {
                          if (["Enter", " "].includes(e.key)) {
                            e.preventDefault();
                            ce_toggleDD("eYear");
                          }
                        }}
                      >
                        <input
                          type="text"
                          value={ce_displayEYear}
                          placeholder={ce_yearPlaceholder}
                          class="ce-input-dis"
                          readonly
                          tabindex="-1"
                          on:click|stopPropagation
                        />
                        <span class="ce-arrow">▼</span>
                      </div>
                      {#if ce_activeDropdown === "eYear"}
                        <div
                          class="ce-options"
                          role="listbox"
                          tabindex="-1"
                          on:click|stopPropagation={() => {}}
                          on:keydown|stopPropagation={() => {}}
                        >
                          {#each ce_displayYears as displayY, idx}
                            <button
                              type="button"
                              class="ce-opt"
                              role="option"
                              aria-selected={ce_formData.eYear === ce_years[idx].toString()}
                              on:click|stopPropagation={() =>
                                ce_selectOpt("eYear", ce_years[idx])}
                            >
                              {displayY}
                            </button>
                          {/each}
                        </div>
                      {/if}
                    </div>
                  </div>
                </div>
              </div>

              {#if (startDateObj && endDateObj && !isDateRangeValid) || ce_validationErrors.has("dateRange")}
                <div class="ce-error-msg">
                  ⚠️ {lang.invalidDateRangeMsg}
                </div>
              {/if}

              <div class="ce-time-capacity-row">
                <div class="ce-input-group">
                  <label for="ce_startTime"
                    >{lang.startTimeLabel} <span class="ce-req">*</span></label
                  >
                  <div
                    class="ce-dd-wrap"
                    class:error={ce_validationErrors.has("startTime")}
                  >
                    <div
                      class="ce-trigger-compact"
                      role="button"
                      tabindex="0"
                      on:click|stopPropagation={() => ce_toggleDD("startTime")}
                      on:keydown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          ce_toggleDD("startTime");
                        }
                      }}
                    >
                      <input
                        id="ce_startTime"
                        type="text"
                        value={ce_formData.startTime}
                        placeholder="00:00"
                        class="ce-input-inline"
                        maxlength="5"
                        on:input={(e) => ce_handleTimeInput(e, "startTime")}
                        on:click|stopPropagation={() =>
                          ce_toggleDD("startTime")}
                      />
                      <span class="ce-arrow">▼</span>
                    </div>

                    {#if ce_activeDropdown === "startTime"}
                      <div class="ce-options" role="listbox">
                        {#each ce_timeList as t}
                          <div
                            class="ce-opt"
                            role="option"
                            tabindex="0"
                            aria-selected={ce_formData.startTime === t}
                            on:click|stopPropagation={() =>
                              ce_selectCombo("startTime", t)}
                            on:keydown={(e) => {
                              if (e.key === "Enter") {
                                e.stopPropagation();
                                ce_selectCombo("startTime", t);
                              }
                            }}
                          >
                            {t}
                          </div>
                        {/each}
                      </div>
                    {/if}
                  </div>
                </div>

                <div class="ce-input-group">
                  <label for="ce_endTime"
                    >{lang.endTimeLabel} <span class="ce-req">*</span></label
                  >
                  <div
                    class="ce-dd-wrap"
                    class:error={ce_validationErrors.has("endTime")}
                  >
                    <div
                      class="ce-trigger-compact"
                      role="button"
                      tabindex="0"
                      on:click|stopPropagation={() => ce_toggleDD("endTime")}
                      on:keydown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          ce_toggleDD("endTime");
                        }
                      }}
                    >
                      <input
                        id="ce_endTime"
                        type="text"
                        value={ce_formData.endTime}
                        placeholder="00:00"
                        class="ce-input-inline"
                        maxlength="5"
                        on:input={(e) => ce_handleTimeInput(e, "endTime")}
                        on:click|stopPropagation={() => ce_toggleDD("endTime")}
                      />
                      <span class="ce-arrow">▼</span>
                    </div>

                    {#if ce_activeDropdown === "endTime"}
                      <div class="ce-options" role="listbox">
                        {#each ce_timeList as t}
                          <div
                            class="ce-opt"
                            role="option"
                            tabindex="0"
                            aria-selected={ce_formData.endTime === t}
                            on:click|stopPropagation={() =>
                              ce_selectCombo("endTime", t)}
                            on:keydown={(e) => {
                              if (e.key === "Enter") {
                                e.stopPropagation();
                                ce_selectCombo("endTime", t);
                              }
                            }}
                          >
                            {t}
                          </div>
                        {/each}
                      </div>
                    {/if}
                  </div>
                </div>

                <div class="ce-input-group">
                  <label for="ce_totalSlots"
                    >{lang.capacityLabel} <span class="ce-req">*</span></label
                  >
                  <div
                    class="ce-dd-wrap"
                    class:error={ce_validationErrors.has("totalSlots")}
                  >
                    <div
                      class="ce-trigger-compact"
                      role="button"
                      tabindex="0"
                      on:click|stopPropagation={() => ce_toggleDD("slots")}
                      on:keydown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          ce_toggleDD("slots");
                        }
                      }}
                    >
                      <input
                        id="ce_totalSlots"
                        type="number"
                        min="0"
                        bind:value={ce_formData.totalSlots}
                        placeholder={currentLang === "th" ? "สูงสุด" : "Max"}
                        class="ce-input-inline"
                        on:input={(e) => {
                          ce_noNegative(e);
                          ce_recalcRewards();
                        }}
                        on:click|stopPropagation={() => ce_toggleDD("slots")}
                      />
                      <span class="ce-arrow">▼</span>
                    </div>

                    {#if ce_activeDropdown === "slots"}
                      <div class="ce-options" role="listbox">
                        {#each [50, 100, 200, 500, 1000, 2000, 5000] as s}
                          <div
                            class="ce-opt"
                            role="option"
                            tabindex="0"
                            aria-selected={ce_formData.totalSlots === s}
                            on:click|stopPropagation={() =>
                              ce_selectCombo("totalSlots", s)}
                            on:keydown={(e) => {
                              if (e.key === "Enter") {
                                e.stopPropagation();
                                ce_selectCombo("totalSlots", s);
                              }
                            }}
                          >
                            {s} {currentLang === "th" ? "ที่นั่ง" : "Slots"}
                          </div>
                        {/each}
                      </div>
                    {/if}
                  </div>
                </div>

                <div class="ce-input-group">
                  <label for="ce_distanceKm">{lang.distanceLabel}</label>
                  <div class="ce-dd-wrap">
                    <div
                      class="ce-trigger-compact"
                      role="button"
                      tabindex="0"
                      on:click|stopPropagation={() => ce_toggleDD("distanceKm")}
                      on:keydown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          ce_toggleDD("distanceKm");
                        }
                      }}
                    >
                      <input
                        id="ce_distanceKm"
                        type="number"
                        min="0"
                        step="1"
                        bind:value={ce_formData.distanceKm}
                        placeholder="0"
                        class="ce-input-inline"
                        on:click|stopPropagation={() =>
                          ce_toggleDD("distanceKm")}
                      />
                      <span class="ce-unit-label">km</span>
                      <span class="ce-arrow">▼</span>
                    </div>

                    {#if ce_activeDropdown === "distanceKm"}
                      <div class="ce-options" role="listbox">
                        {#each [1, 2, 3, 5, 10, 15, 21, 42] as d}
                          <div
                            class="ce-opt"
                            role="option"
                            tabindex="0"
                            aria-selected={ce_formData.distanceKm === d}
                            on:click|stopPropagation={() =>
                              ce_selectOpt("distanceKm", d)}
                            on:keydown={(e) => {
                              if (e.key === "Enter") {
                                e.stopPropagation();
                                ce_selectOpt("distanceKm", d);
                              }
                            }}
                          >
                            {d} km
                          </div>
                        {/each}
                      </div>
                    {/if}
                  </div>
                </div>
              </div>
            </div>

            <!-- Holidays & Exclusions -->
            <div
              class="ce-card ce-config-card"
              role="button"
              tabindex="0"
              on:click|stopPropagation
              on:keydown|stopPropagation
            >
              {#if !isDateRangeValid}
                <div class="ce-lock-overlay">
                  <svg
                    class="ce-lock-icon-svg"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    ></path>
                  </svg>
                  <span>Set valid <b>Start & End Date</b> to unlock.</span>
                </div>
              {/if}

              <div class="ce-card-head">
                <svg
                  class="ce-icon-svg"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                  ></path>
                </svg>
                <span>{lang.holidaysAndExclusions}</span>
              </div>

              <div class="ce-holiday-control">
                <div class="ce-holiday-buttons">
                  <label
                    class="ce-check-row"
                    class:active={ce_holidayMode === "weekends"}
                  >
                    <input
                      type="checkbox"
                      checked={ce_holidayMode === "weekends"}
                      disabled={!isDateRangeValid}
                      on:change={() =>
                        ce_setHolidayMode(
                          ce_holidayMode === "weekends" ? null : "weekends"
                        )}
                    />
                    <div class="ce-check-content">
                      <span class="ce-check-title"
                        >{lang.excludeWeekendsOption}</span
                      >
                      <span class="ce-check-desc"
                        >{currentLang === "th"
                          ? "ข้ามวันเสาร์และอาทิตย์โดยอัตโนมัติ"
                          : "Automatically skip Saturdays & Sundays."}</span
                      >
                    </div>
                  </label>

                  <label
                    class="ce-check-row"
                    class:active={ce_holidayMode === "none"}
                  >
                    <input
                      type="checkbox"
                      checked={ce_holidayMode === "none"}
                      disabled={!isDateRangeValid}
                      on:change={() =>
                        ce_setHolidayMode(
                          ce_holidayMode === "none" ? null : "none"
                        )}
                    />
                    <div class="ce-check-content">
                      <span class="ce-check-title">{lang.noHolidaysOption}</span
                      >
                      <span class="ce-check-desc"
                        >{currentLang === "th"
                          ? "กิจกรรมดำเนินการทุกวันไม่มีวันหยุด"
                          : "Event runs every day without breaks."}</span
                      >
                    </div>
                  </label>
                </div>

                <hr class="ce-divider" />

                <div class="ce-input-group">
                  <div
                    style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;"
                  >
                    <span
                      style="font-weight: 500; font-size: 0.9rem; color: #374151;"
                    >
                      {currentLang === "th"
                        ? "เพิ่มวันหยุดเฉพาะ (ในช่วงวันที่)"
                        : "Add Specific Holiday (Within Range)"}
                    </span>
                    {#if ce_formData.holidays.length > 0}
                      <button
                        class="ce-btn-reset"
                        on:click|stopPropagation={ce_resetHolidays}
                        type="button"
                      >
                        {currentLang === "th" ? "รีเซ็ตทั้งหมด" : "Reset All"}
                      </button>
                    {/if}
                  </div>

                  <div class="ce-dd-wrap">
                    <button
                      type="button"
                      class="ce-trigger-compact"
                      on:click|stopPropagation={() => {
                        if (isDateRangeValid) {
                          ce_setHolidayMode("specific");
                          ce_toggleDD("holidayDate");
                        }
                      }}
                    >
                      <input
                        type="text"
                        value={ce_formData.holidays.length > 0
                          ? `${ce_formData.holidays.length} date(s) selected`
                          : ""}
                        placeholder="Select dates"
                        class="ce-input-inline"
                        readonly
                        disabled={!isDateRangeValid}
                        tabindex="-1"
                        style="pointer-events: none;"
                      />
                      <span class="ce-arrow">▼</span>
                    </button>

                    {#if ce_activeDropdown === "holidayDate" && isDateRangeValid}
                      <div class="ce-options ce-options-calendar">
                        {#each Object.entries(groupedDates) as [monthYear, dates]}
                          <div class="ce-month-group">
                            <div class="ce-month-header">{monthYear}</div>
                            <div class="ce-date-grid">
                              {#each dates as date}
                                <button
                                  type="button"
                                  class="ce-date-item"
                                  class:selected={ce_formData.holidays.includes(
                                    date.value
                                  )}
                                  class:weekend={date.dayName === "Sat" ||
                                    date.dayName === "Sun"}
                                  on:click|stopPropagation={() =>
                                    ce_toggleHoliday(date.value)}
                                >
                                  <div class="ce-date-day">{date.day}</div>
                                  <div class="ce-date-name">{date.dayName}</div>
                                  {#if ce_formData.holidays.includes(date.value)}
                                    <div class="ce-check-mark">✓</div>
                                  {/if}
                                </button>
                              {/each}
                            </div>
                          </div>
                        {/each}
                      </div>
                    {/if}
                  </div>
                  <span class="ce-hint">
                    Click dates to select/deselect holidays. Dropdown stays open
                    for multiple selections.
                  </span>

                  {#if ce_formData.holidays.length > 0}
                    <div class="ce-tags">
                      {#each ce_formData.holidays as h}
                        <span class="ce-tag">
                          {availableDates.find((d) => d.value === h)
                            ?.fullDisplay || h}
                          <button
                            type="button"
                            class="ce-tag-remove"
                            on:click={() => ce_delHoliday(h)}
                            aria-label="Remove holiday">×</button
                          >
                        </span>
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>
            </div>
            <!-- svelte-ignore a11y-no-noninteractive-element-interactions -->
            <div
              class="ce-card ce-config-card"
              class:ce-locked-card={!ce_formData.totalSlots}
              class:error={ce_validationErrors.has("rewards")}
              role="group"
              aria-label="Rewards Distribution Configuration"
              on:click|stopPropagation
              on:keydown|stopPropagation
            >
              {#if !ce_formData.totalSlots}
                <div class="ce-lock-overlay">
                  <svg
                    class="ce-lock-icon-svg"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    ></path>
                  </svg>
                  <span
                    >Enter <b>Total Capacity</b> first to unlock rewards.</span
                  >
                </div>
              {/if}

              <div class="ce-card-head">
                <svg
                  class="ce-icon-svg"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <span>{lang.rewardsDistribution}</span>
              </div>

              <div class="ce-rewards-section">
                <!-- จำนวนของรางวัลทั้งหมด -->
                <div class="ce-total-rewards-row">
                  <div class="ce-field-group" style="flex: 1;">
                    <label
                      for="ce_totalRewards"
                      style="display: flex; align-items: center; gap: 8px; color: #f59e0b; font-weight: 600;"
                    >
                      <svg
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
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        ></path>
                      </svg>
                      {currentLang === "th"
                        ? "จำนวนของรางวัลทั้งหมด"
                        : "Total Reward Items"}
                    </label>
                    <div
                      style="display: flex; align-items: center; gap: 8px; margin-top: 8px;"
                    >
                      <input
                        id="ce_totalRewards"
                        type="number"
                        min="1"
                        bind:value={ce_formData.totalRewards}
                        on:input={ce_noNegative}
                        class="ce-input-compact"
                        placeholder={currentLang === "th"
                          ? "เช่น 100 ชิ้น"
                          : "e.g. 100 items"}
                        style="max-width: 200px;"
                      />
                      <span class="ce-unit-label"
                        >{currentLang === "th" ? "ชิ้น" : "items"}</span
                      >
                    </div>
                  </div>
                </div>

                <!-- คำอธิบายระบบ Reward -->
                <div
                  class="ce-reward-info-box"
                  style="background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.05)); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 16px; margin: 16px 0;"
                >
                  <div
                    style="display: flex; align-items: flex-start; gap: 12px;"
                  >
                    <div
                      style="width: 36px; height: 36px; background: rgba(59, 130, 246, 0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;"
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
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                    </div>
                    <div style="flex: 1;">
                      <div
                        style="font-size: 14px; font-weight: 600; color: #60a5fa; margin-bottom: 6px;"
                      >
                        {currentLang === "th"
                          ? "วิธีการแจกรางวัล"
                          : "How Rewards Work"}
                      </div>
                      <div
                        style="font-size: 13px; color: #93c5fd; line-height: 1.6;"
                      >
                        {currentLang === "th"
                          ? "ผู้ที่วิ่งครบตามจำนวนรอบของแต่ละ Tier จะได้รับรางวัลนั้น (ใครครบก่อนได้ก่อน) จนกว่าของรางวัลจะหมด"
                          : "Participants who complete required rounds for each tier will receive that reward (first come first served) until items run out"}
                      </div>
                    </div>
                  </div>
                </div>

                <!-- รายการ Tier รางวัล -->
                <div class="ce-stack">
                  {#each ce_formData.rewards as reward, i}
                    <div
                      class="ce-tier-card"
                      style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(234, 88, 12, 0.04)); border-color: rgba(245, 158, 11, 0.3);"
                    >
                      <div class="ce-tier-header">
                        <span
                          class="ce-badge"
                          style="background: linear-gradient(135deg, #f59e0b, #d97706);"
                        >
                          <svg
                            width="14"
                            height="14"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            stroke-width="2.5"
                            style="margin-right: 4px;"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                            ></path>
                          </svg>
                          Tier {i + 1}
                        </span>
                        {#if ce_formData.rewards.length > 1}
                          <button
                            type="button"
                            class="ce-btn-remove"
                            on:click={() => ce_removeTier(i)}
                            title={lang.removeTier}
                            aria-label="{lang.removeTier} {i + 1}">×</button
                          >
                        {/if}
                      </div>
                      <div
                        class="ce-tier-body"
                        style="grid-template-columns: 1fr 1fr;"
                      >
                        <!-- ชื่อรางวัล -->
                        <div class="ce-tier-field">
                          <label for="ce_name_{i}">
                            <svg
                              width="14"
                              height="14"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              stroke-width="2"
                              style="margin-right: 4px; vertical-align: middle;"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                              ></path>
                            </svg>
                            {currentLang === "th"
                              ? "ชื่อรางวัล"
                              : "Reward Name"}
                          </label>
                          <input
                            id="ce_name_{i}"
                            type="text"
                            bind:value={reward.name}
                            placeholder={currentLang === "th"
                              ? "เช่น 🥇 Premium Shoes"
                              : "e.g. 🥇 Premium Shoes"}
                            class="ce-input-compact"
                          />
                        </div>
                        <!-- จำนวนรอบที่ต้องวิ่ง -->
                        <div class="ce-tier-field">
                          <label for="ce_req_{i}">
                            <svg
                              width="14"
                              height="14"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              stroke-width="2"
                              style="margin-right: 4px; vertical-align: middle;"
                            >
                              <path
                                stroke-linecap="round"
                                stroke-linejoin="round"
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              ></path>
                            </svg>
                            {currentLang === "th"
                              ? "วิ่งครบกี่รอบ?"
                              : "Rounds Required"}
                          </label>
                          <div
                            style="display: flex; align-items: center; gap: 8px;"
                          >
                            <input
                              id="ce_req_{i}"
                              type="number"
                              min="1"
                              bind:value={reward.requirement}
                              on:input={ce_noNegative}
                              class="ce-input-compact"
                              placeholder={currentLang === "th"
                                ? "เช่น 30"
                                : "e.g. 30"}
                              style="flex: 1;"
                            />
                            <span class="ce-unit-label"
                              >{currentLang === "th" ? "รอบ" : "rounds"}</span
                            >
                          </div>
                        </div>
                      </div>
                    </div>
                  {/each}
                </div>

                <!-- ปุ่มเพิ่ม Tier -->
                <button
                  type="button"
                  class="ce-btn-dashed"
                  on:click={ce_addTier}
                  style="margin-top: 12px;"
                >
                  {currentLang === "th" ? "+ เพิ่ม Tier" : "+ Add Tier"}
                </button>

                <!-- สรุปรางวัลทั้งหมด -->
                {#if ce_formData.rewards.filter((r) => r.name && r.requirement).length > 0}
                  <div
                    style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 10px; padding: 12px; margin-top: 16px;"
                  >
                    <div
                      style="font-size: 13px; font-weight: 600; color: #10b981; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;"
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
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        ></path>
                      </svg>
                      {currentLang === "th"
                        ? "สรุป Reward Tiers"
                        : "Reward Tiers Summary"}
                    </div>
                    <div
                      style="font-size: 12px; color: #6ee7b7; line-height: 1.8;"
                    >
                      {#each ce_formData.rewards.filter((r) => r.name && r.requirement) as reward, idx}
                        <div
                          style="display: flex; align-items: center; gap: 8px; padding: 4px 0;"
                        >
                          <span
                            style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; padding: 2px 8px; border-radius: 4px; font-weight: 600;"
                          >
                            {reward.requirement} {currentLang === "th" ? "รอบ" : "rounds"}
                          </span>
                          <span>→</span>
                          <span style="color: #f0fdf4;">{reward.name}</span>
                        </div>
                      {/each}
                      <div
                        style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(16, 185, 129, 0.2); color: #a7f3d0;"
                      >
                        {currentLang === "th"
                          ? "ของรางวัลทั้งหมด:"
                          : "Total reward items:"}
                        <strong style="color: #10b981;">
                          {ce_formData.totalRewards || 0}
                        </strong>
                        {currentLang === "th" ? "ชิ้น (แชร์ทุก Tier)" : "items (shared across all tiers)"}
                      </div>
                    </div>
                  </div>
                {/if}

<style>
  /* ==================== SETTINGS PAGE STYLES ==================== */
  
  .settings-container {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }
  
  /* Loading State */
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    color: #64748b;
  }
  
  .loading-state svg {
    margin-bottom: 1rem;
    animation: spin 1s linear infinite;
  }
  
  /* Settings Content */
  .settings-content {
    animation: fadeIn 0.3s ease;
  }
  
  /* Page Header */
  .page-header {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: rgba(30, 41, 59, 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
  }
  
  .header-icon-circle {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: linear-gradient(135deg, #10b981, #059669);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }
  
  .header-icon-circle svg {
    color: white;
  }
  
  .header-text h1 {
    font-size: 1.75rem;
    font-weight: 700;
    color: #f8fafc;
    margin: 0 0 0.25rem 0;
  }
  
  .header-text p {
    font-size: 0.95rem;
    color: #94a3b8;
    margin: 0;
  }
  
  /* Info Cards */
  .info-card {
    background: rgba(30, 41, 59, 0.6);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 20px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
  }
  
  .card-headerr {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  
  .card-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: rgba(16, 185, 129, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  
  .card-icon svg {
    color: #10b981;
  }
  
  .card-headerr h2 {
    font-size: 1.25rem;
    font-weight: 700;
    color: #f8fafc;
    margin: 0;
  }
  
  .card-content {
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }
  
  /* Form Fields */
  .field-row {
    display: flex;
    gap: 1rem;
    align-items: flex-start;
  }
  
  .form-field {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .form-field label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #cbd5e1;
  }
  
  /* Input Wrapper */
  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  
  .input-wrapper input {
    width: 100%;
    padding: 0.875rem 1rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    color: #f8fafc;
    font-size: 0.95rem;
    transition: all 0.2s;
  }
  
  .input-wrapper input:focus {
    outline: none;
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }
  
  .input-wrapper input::placeholder {
    color: #64748b;
  }
  
  .input-wrapper input:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  .input-wrapper.error input {
    border-color: #ef4444;
  }
  
  .input-wrapper.locked {
    opacity: 0.7;
  }
  
  .input-wrapper.locked svg {
    position: absolute;
    right: 1rem;
    color: #64748b;
  }
  
  /* Custom Select Dropdown */
  .custom-select {
    position: relative;
    width: 100%;
  }
  
  .select-btn {
    width: 100%;
    padding: 0.875rem 1rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    color: #f8fafc;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    transition: all 0.2s;
    text-align: left;
  }
  
  .select-btn:hover {
    border-color: rgba(16, 185, 129, 0.4);
  }
  
  .select-btn.active {
    border-color: #10b981;
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
  }
  
  .select-btn.error {
    border-color: #ef4444;
  }
  
  .select-btn .placeholder {
    color: #64748b;
  }
  
  .select-btn .arrow {
    transition: transform 0.2s;
    flex-shrink: 0;
  }
  
  .select-btn .arrow.rotate {
    transform: rotate(180deg);
  }
  
  .dropdown-menu {
    position: absolute;
    top: calc(100% + 0.5rem);
    left: 0;
    right: 0;
    background: #1e293b;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    max-height: 250px;
    overflow-y: auto;
    z-index: 100;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    animation: slideDown 0.2s ease;
  }
  
  .dropdown-item {
    width: 100%;
    padding: 0.875rem 1rem;
    background: transparent;
    border: none;
    color: #f8fafc;
    font-size: 0.95rem;
    text-align: left;
    cursor: pointer;
    transition: all 0.2s;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
  
  .dropdown-item:last-child {
    border-bottom: none;
  }
  
  .dropdown-item:hover {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }
  
  /* Language Toggle */
  .language-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    background: rgba(15, 23, 42, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
  }
  
  .language-label {
    font-size: 0.95rem;
    color: #cbd5e1;
    font-weight: 600;
  }
  
  .toggle-switch {
    position: relative;
    width: 60px;
    height: 32px;
    background: rgba(100, 116, 139, 0.3);
    border-radius: 16px;
    cursor: pointer;
    transition: all 0.3s;
    border: 1px solid rgba(100, 116, 139, 0.4);
  }
  
  .toggle-switch.active {
    background: rgba(16, 185, 129, 0.2);
    border-color: #10b981;
  }
  
  .toggle-slider {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 24px;
    height: 24px;
    background: #64748b;
    border-radius: 50%;
    transition: all 0.3s;
  }
  
  .toggle-switch.active .toggle-slider {
    transform: translateX(28px);
    background: #10b981;
  }
  
  .toggle-labels {
    display: flex;
    justify-content: space-between;
    width: 100%;
    padding: 0 8px;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    font-size: 0.7rem;
    font-weight: 700;
    pointer-events: none;
  }
  
  .toggle-labels span {
    color: #94a3b8;
    transition: color 0.3s;
  }
  
  .toggle-switch.active .toggle-labels span:last-child {
    color: #10b981;
  }
  
  .toggle-switch:not(.active) .toggle-labels span:first-child {
    color: #64748b;
  }
  
  /* Save Button */
  .save-section {
    display: flex;
    justify-content: flex-end;
    margin-top: 2rem;
  }
  
  .btn-save {
    padding: 0.875rem 2rem;
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
    border-radius: 12px;
    font-weight: 600;
    font-size: 1rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    transition: all 0.3s;
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
  }
  
  .btn-save:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(16, 185, 129, 0.4);
  }
  
  .btn-save:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  /* Animations */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
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
  
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .settings-container {
      padding: 1rem;
    }
    
    .page-header {
      flex-direction: column;
      text-align: center;
    }
    
    .field-row {
      flex-direction: column;
    }
    
    .header-text h1 {
      font-size: 1.5rem;
    }
  }
  
  @media (max-width: 640px) {
    .settings-container {
      padding: 0.5rem;
    }
    
    .info-card {
      padding: 1rem;
    }
    
    .page-header {
      padding: 1rem;
    }
    
    .header-icon-circle {
      width: 50px;
      height: 50px;
    }
  }
</style>