=== settings/./_components/LanguageToggle.svelte ===
<script lang="ts">
  import { appState } from '../../_lib/stores/appState';

  function toggleLanguage() {
    appState.update(state => ({
      ...state,
      currentLang: state.currentLang === 'th' ? 'en' : 'th'
    }));
    if (typeof localStorage !== 'undefined') {
      const newLang = $appState.currentLang === 'th' ? 'en' : 'th';
      localStorage.setItem('app_language', newLang);
    }
  }

  function setLanguage(lang: 'th' | 'en') {
    appState.update(state => ({ ...state, currentLang: lang }));
    if (typeof localStorage !== 'undefined') localStorage.setItem('app_language', lang);
  }
</script>

<div class="language-toggle">
  <div class="toggle-header">
    <h3 class="toggle-title">
      {$appState.currentLang === 'th' ? 'ภาษา' : 'Language'}
    </h3>
    <p class="toggle-desc">
      {$appState.currentLang === 'th' ? 'เลือกภาษาที่ต้องการใช้งาน' : 'Select your preferred language'}
    </p>
  </div>
  
  <div class="language-options">
    <button 
      class="lang-option" 
      class:active={$appState.currentLang === 'th'}
      on:click={() => setLanguage('th')}
    >
      <div class="lang-icon">🇹🇭</div>
      <div class="lang-name">ไทย</div>
    </button>
    
    <button 
      class="lang-option" 
      class:active={$appState.currentLang === 'en'}
      on:click={() => setLanguage('en')}
    >
      <div class="lang-icon">🇬🇧</div>
      <div class="lang-name">English</div>
    </button>
  </div>
</div>

<style>
  .language-toggle { padding: 0; }
  .toggle-header { margin-bottom: 1rem; }
  .toggle-title { font-size: 1rem; font-weight: 600; color: var(--text); margin: 0 0 0.25rem; }
  .toggle-desc { font-size: 0.875rem; color: var(--text-muted); margin: 0; }
  
  .language-options { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
  .lang-option { display: flex; flex-direction: column; align-items: center; gap: 0.75rem; padding: 1.5rem; background: white; border: 2px solid var(--border); border-radius: 12px; cursor: pointer; transition: all 0.2s; }
  .lang-option:hover { border-color: var(--primary); background: var(--bg-alt); }
  .lang-option.active { border-color: var(--primary); background: #f0fdfa; }
  .lang-icon { font-size: 2rem; }
  .lang-name { font-size: 0.875rem; font-weight: 600; color: var(--text); }
  
  @media (max-width: 640px) { .language-options { grid-template-columns: 1fr; } }
</style>