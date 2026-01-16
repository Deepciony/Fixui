=== events/./_components/SearchBar.svelte ===
<script lang="ts">
  export let searchQuery: string;
  export let placeholder: string = 'Search...';
</script>

<div class="search-bar">
  <svg class="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
  <input
    type="text"
    class="search-input"
    {placeholder}
    bind:value={searchQuery}
  />
  {#if searchQuery}
    <button class="clear-btn" on:click={() => searchQuery = ''} aria-label="Clear search">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  {/if}
</div>

<style>
  .search-bar {
    position: relative;
    flex: 1;
    min-width: 0;
  }
  
  .search-icon {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    width: 20px;
    height: 20px;
    color: var(--text-muted);
    pointer-events: none;
  }
  
  .search-input {
    width: 100%;
    padding: 0.75rem 3rem 0.75rem 3rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 0.875rem;
    background: white;
    transition: all 0.2s;
  }
  
  .search-input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1);
  }
  
  .clear-btn {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    width: 28px;
    height: 28px;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: 4px;
    color: var(--text-muted);
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .clear-btn:hover {
    background: var(--bg-alt);
    color: var(--text);
  }
  
  .clear-btn svg {
    width: 16px;
    height: 16px;
  }
</style>