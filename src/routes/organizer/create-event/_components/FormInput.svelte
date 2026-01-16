=== ./_components/FormInput.svelte ===
<script lang="ts">
  export let label: string;
  export let value: string | number | null;
  export let type: 'text' | 'number' | 'email' | 'time' = 'text';
  export let placeholder: string = '';
  export let required: boolean = false;
  export let error: string = '';
  export let disabled: boolean = false;
  export let min: number | undefined = undefined;
  export let max: number | undefined = undefined;
  export let step: number | string | undefined = undefined;
</script>

<div class="form-input">
  <label class="label">
    {label}
    {#if required}
      <span class="required">*</span>
    {/if}
  </label>
  
  <input
    {type}
    {placeholder}
    {disabled}
    {min}
    {max}
    {step}
    class="input"
    class:error={error}
    bind:value
    on:input
    on:change
    on:blur
  />
  
  {#if error}
    <span class="error-message">{error}</span>
  {/if}
</div>

<style>
  .form-input {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .label {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--text);
  }
  
  .required {
    color: var(--error);
  }
  
  .input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 0.875rem;
    transition: all 0.2s;
  }
  
  .input:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.1);
  }
  
  .input:disabled {
    background: var(--bg-alt);
    cursor: not-allowed;
    opacity: 0.6;
  }
  
  .input.error {
    border-color: var(--error);
  }
  
  .error-message {
    font-size: 0.75rem;
    color: var(--error);
  }
</style>