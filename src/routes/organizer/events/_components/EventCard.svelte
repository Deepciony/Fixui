=== events/./_components/EventCard.svelte ===
<script lang="ts">
  import type { AppEvent } from '../../_lib/stores/eventList';
  import { appState } from '../../_lib/stores/appState';
  import { formatDate } from '../../_lib/utils/dateTime';
  import { t } from '../../_lib/i18n';
  
  export let event: AppEvent;
  export let onEdit: () => void;
  export let onDelete: () => void;
  export let onView: () => void;
  
  $: lang = $appState.currentLang;
  $: statusColor = event.status === 'active' ? 'var(--success)' : event.status === 'draft' ? 'var(--warning)' : 'var(--text-muted)';
  $: statusBg = event.status === 'active' ? '#f0fdf4' : event.status === 'draft' ? '#fefce8' : '#f8fafc';
  $: capacityPercent = event.totalSlots > 0 ? (event.participantCount / event.totalSlots) * 100 : 0;
</script>

<div class="event-card">
  <div class="card-image" on:click={onView} on:keypress={onView} role="button" tabindex="0">
    {#if event.imageUrl}
      <img src={event.imageUrl} alt={event.title} />
    {:else}
      <div class="image-placeholder">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    {/if}
    <div class="status-badge" style="color: {statusColor}; background: {statusBg}">
      {t(event.status)}
    </div>
  </div>
  
  <div class="card-content">
    <h3 class="event-title" on:click={onView} on:keypress={onView} role="button" tabindex="0">
      {event.title}
    </h3>
    
    <div class="event-meta">
      <div class="meta-item">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>{event.location}</span>
      </div>
      
      <div class="meta-item">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span>{formatDate(event.startDate, 'short')}</span>
      </div>
    </div>
    
    <div class="capacity-section">
      <div class="capacity-label">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span>{event.participantCount} / {event.totalSlots}</span>
        <span class="percentage">({capacityPercent.toFixed(0)}%)</span>
      </div>
      <div class="capacity-bar">
        <div class="capacity-fill" style="width: {capacityPercent}%"></div>
      </div>
    </div>
    
    <div class="card-footer">
      <div class="event-type">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>
          {event.eventType === 'single_day' 
            ? (lang === 'th' ? 'วันเดียว' : 'Single Day') 
            : (lang === 'th' ? 'หลายวัน' : 'Multi Day')}
        </span>
      </div>
      
      {#if event.distanceKm}
        <div class="distance">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>{event.distanceKm} km</span>
        </div>
      {/if}
    </div>
    
    <div class="card-actions">
      <button class="btn-action" on:click={onView}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        {t('view')}
      </button>
      
      <button class="btn-action" on:click={onEdit}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        {t('edit')}
      </button>
      
      <button class="btn-action danger" on:click={onDelete}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        {t('delete')}
      </button>
    </div>
  </div>
</div>

<style>
  .event-card {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
    transition: all 0.2s;
    border: 1px solid var(--border);
    display: flex;
    flex-direction: column;
  }
  
  .event-card:hover {
    box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1);
    transform: translateY(-2px);
  }
  
  .card-image {
    position: relative;
    width: 100%;
    height: 180px;
    cursor: pointer;
    overflow: hidden;
  }
  
  .card-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s;
  }
  
  .card-image:hover img {
    transform: scale(1.05);
  }
  
  .image-placeholder {
    width: 100%;
    height: 100%;
    background: var(--bg-alt);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .image-placeholder svg {
    width: 64px;
    height: 64px;
    color: var(--text-light);
  }
  
  .status-badge {
    position: absolute;
    top: 0.75rem;
    right: 0.75rem;
    padding: 0.375rem 0.75rem;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
    backdrop-filter: blur(8px);
  }
  
  .card-content {
    padding: 1.25rem;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  .event-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: var(--text);
    margin: 0;
    cursor: pointer;
    transition: color 0.2s;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  
  .event-title:hover {
    color: var(--primary);
  }
  
  .event-meta {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .meta-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--text-muted);
  }
  
  .meta-item svg {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
  }
  
  .capacity-section {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .capacity-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    color: var(--text);
  }
  
  .capacity-label svg {
    width: 16px;
    height: 16px;
    color: var(--primary);
  }
  
  .percentage {
    color: var(--text-muted);
    font-size: 0.75rem;
  }
  
  .capacity-bar {
    height: 6px;
    background: var(--bg-alt);
    border-radius: 3px;
    overflow: hidden;
  }
  
  .capacity-fill {
    height: 100%;
    background: var(--primary);
    transition: width 0.3s;
  }
  
  .card-footer {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding-top: 0.75rem;
    border-top: 1px solid var(--border);
  }
  
  .event-type,
  .distance {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.875rem;
    color: var(--text-muted);
  }
  
  .event-type svg,
  .distance svg {
    width: 14px;
    height: 14px;
  }
  
  .card-actions {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.5rem;
    margin-top: auto;
  }
  
  .btn-action {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.375rem;
    padding: 0.625rem 0.5rem;
    background: var(--bg-alt);
    border: 1px solid var(--border);
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--text);
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-action:hover {
    background: var(--bg-hover);
    border-color: var(--primary);
    color: var(--primary);
  }
  
  .btn-action.danger:hover {
    border-color: var(--error);
    color: var(--error);
  }
  
  .btn-action svg {
    width: 16px;
    height: 16px;
  }
  
  @media (max-width: 640px) {
    .card-actions {
      grid-template-columns: 1fr 1fr;
    }
    
    .btn-action:first-child {
      grid-column: 1 / -1;
    }
  }
</style>