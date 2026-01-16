=== ./_components/TierQuotaInput.svelte ===
<script lang="ts">
  export let value: number | null;
  export let placeholder: string = '';
  export let min: number = 0;
</script>

<input type="number" {min} {placeholder} bind:value class="quota-input" />

<style>
  .quota-input { width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 8px; font-size: 0.875rem; text-align: center; }
  .quota-input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1); }
</style>