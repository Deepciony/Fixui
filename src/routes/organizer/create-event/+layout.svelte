=== ./+layout.svelte ===
<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { eventForm } from '../_lib/stores/eventForm';
  import { appState } from '../_lib/stores/appState';
  import { t } from '../_lib/i18n';
  
  const tabs = [
    { 
      id: 'general', 
      path: '/organizer/create-event/general',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
    },
    { 
      id: 'capacity', 
      path: '/organizer/create-event/capacity',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
    },
    { 
      id: 'rewards', 
      path: '/organizer/create-event/rewards',
      icon: 'M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V6a2 2 0 10-2 2h2zm0 0h4l-4 4-4-4h4z'
    },
    { 
      id: 'summary', 
      path: '/organizer/create-event/summary',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4'
    }
  ];
  
  $: currentPath = $page.url.pathname;
  $: activeTab = tabs.find(t => currentPath.includes(t.id))?.id || 'general';
  $: activeIndex = tabs.findIndex(t => t.id === activeTab);
  
  function handleCancel() {
    if (confirm($appState.currentLang === 'th' ? 'ยกเลิกการแก้ไข?' : 'Cancel editing?')) {
      eventForm.reset();
      goto('/organizer/events');
    }
  }
</script>

<div class="create-event-layout">
  <div class="ce-header">
    <div class="ce-header-content">
      <button class="btn-back" on:click={() => goto('/organizer/events')} title="Back to events">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      
      <div>
        <h2 class="ce-title">
          {$eventForm.editingEventId ? t('editEvent') : t('createNewEvent')}
        </h2>
        {#if $eventForm.editingEventId}
          <p class="ce-subtitle">Event ID: {$eventForm.editingEventId}</p>
        {/if}
      </div>
    </div>
    
    <div class="ce-actions">
      {#if $eventForm.validationErrors.size > 0}
        <div class="validation-alert">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{$eventForm.validationErrors.size} {$eventForm.validationErrors.size === 1 ? 'error' : 'errors'}</span>
        </div>
      {/if}
      
      <button class="btn-cancel" on:click={handleCancel}>
        {t('cancel')}
      </button>
    </div>
  </div>
  
  <nav class="tab-navigation">
    {#each tabs as tab, i}
      <button
        class="tab-btn"
        class:active={activeTab === tab.id}
        class:completed={i < activeIndex}
        on:click={() => goto(tab.path)}
      >
        <div class="tab-icon">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={tab.icon} />
          </svg>
        </div>
        <span class="tab-label">{t(tab.id)}</span>
        {#if i < activeIndex}
          <div class="check-mark">✓</div>
        {/if}
      </button>
      
      {#if i < tabs.length - 1}
        <div class="tab-connector" class:completed={i < activeIndex}></div>
      {/if}
    {/each}
  </nav>
  
  <div class="ce-content">
    <slot />
  </div>
</div>

<style>
  .create-event-layout {
    min-height: calc(100vh - 64px);
    background: var(--bg-alt);
  }
  
  .ce-header {
    background: white;
    border-bottom: 1px solid var(--border);
    padding: 1.5rem 2rem;
  }
  
  .ce-header-content {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 1rem;
  }
  
  .btn-back {
    width: 40px;
    height: 40px;
    padding: 0;
    background: var(--bg-alt);
    border: 1px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-back:hover {
    background: var(--bg-hover);
    border-color: var(--primary);
  }
  
  .btn-back svg {
    width: 20px;
    height: 20px;
    color: var(--text);
  }
  
  .ce-title {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text);
    margin: 0;
  }
  
  .ce-subtitle {
    font-size: 0.875rem;
    color: var(--text-muted);
    margin: 0.25rem 0 0;
  }
  
  .ce-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    margin-left: auto;
  }
  
  .validation-alert {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: #fee2e2;
    border: 1px solid #fca5a5;
    border-radius: 6px;
    color: #991b1b;
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  .validation-alert svg {
    width: 18px;
    height: 18px;
  }
  
  .btn-cancel {
    padding: 0.625rem 1.25rem;
    background: transparent;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text);
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-cancel:hover {
    background: var(--bg-hover);
    border-color: var(--error);
    color: var(--error);
  }
  
  .tab-navigation {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1.5rem 2rem;
    background: white;
    border-bottom: 1px solid var(--border);
    max-width: 1200px;
    margin: 0 auto;
    overflow-x: auto;
  }
  
  .tab-btn {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    background: var(--bg-alt);
    border: 2px solid var(--border);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 120px;
    flex-shrink: 0;
  }
  
  .tab-btn:hover {
    background: var(--bg-hover);
  }
  
  .tab-btn.active {
    background: #f0fdfa;
    border-color: var(--primary);
  }
  
  .tab-btn.completed {
    background: #f0fdf4;
    border-color: var(--success);
  }
  
  .tab-icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
  }
  
  .tab-icon svg {
    width: 100%;
    height: 100%;
    color: var(--text-muted);
  }
  
  .tab-btn.active .tab-icon svg {
    color: var(--primary);
  }
  
  .tab-btn.completed .tab-icon svg {
    color: var(--success);
  }
  
  .tab-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text);
  }
  
  .check-mark {
    position: absolute;
    top: -6px;
    right: -6px;
    width: 20px;
    height: 20px;
    background: var(--success);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: bold;
  }
  
  .tab-connector {
    flex: 1;
    height: 2px;
    background: var(--border);
    min-width: 20px;
    flex-shrink: 0;
  }
  
  .tab-connector.completed {
    background: var(--success);
  }
  
  .ce-content {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  @media (max-width: 768px) {
    .ce-header {
      padding: 1rem;
    }
    
    .ce-header-content {
      flex-wrap: wrap;
    }
    
    .ce-actions {
      width: 100%;
      margin-left: 0;
      justify-content: flex-end;
    }
    
    .tab-navigation {
      padding: 1rem;
    }
    
    .ce-content {
      padding: 1rem;
    }
  }
</style>





















