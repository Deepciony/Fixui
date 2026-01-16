<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { appState } from '../../_lib/stores/appState';
  
  export let onScan: (code: string) => void;
  export let isVerifying: boolean;
  export let mode: 'check-in' | 'check-out';
  
  $: lang = $appState.currentLang;
  
  let videoRef: HTMLVideoElement;
  let canvasRef: HTMLCanvasElement;
  let stream: MediaStream | null = null;
  let scanning = false;
  let cameraError = '';
  
  async function startCamera() {
    try {
      stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef) {
        videoRef.srcObject = stream;
        scanning = true;
      }
    } catch (error) {
      console.error('Camera error:', error);
      cameraError = lang === 'th' ? 'ไม่สามารถเปิดกล้องได้' : 'Cannot access camera';
    }
  }
  
  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
      scanning = false;
    }
  }
  
  function simulateScan() {
    // Simulate QR code scan (in real app, use a QR library like jsQR)
    const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
    onScan(mockCode);
  }
  
  onMount(() => {
    startCamera();
  });
  
  onDestroy(() => {
    stopCamera();
  });
</script>

<div class="qr-scanner">
  <div class="scanner-header">
    <h3 class="scanner-title">
      {lang === 'th' ? 'สแกน QR Code' : 'Scan QR Code'}
    </h3>
    <p class="scanner-desc">
      {lang === 'th' ? 'นำ QR Code เข้าใกล้กล้องเพื่อ' : 'Point QR code at camera to'} 
      {mode === 'check-in' ? (lang === 'th' ? 'เช็คอิน' : 'check-in') : (lang === 'th' ? 'เช็คเอาท์' : 'check-out')}
    </p>
  </div>
  
  <div class="camera-container">
    {#if cameraError}
      <div class="camera-error">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>{cameraError}</p>
      </div>
    {:else}
      <video 
        bind:this={videoRef}
        class="camera-video"
        autoplay
        playsinline
        muted
      >
        <track kind="captions" />
      </video>
      <canvas bind:this={canvasRef} class="camera-canvas"></canvas>
      
      <div class="scan-frame">
        <div class="corner corner-tl"></div>
        <div class="corner corner-tr"></div>
        <div class="corner corner-bl"></div>
        <div class="corner corner-br"></div>
      </div>
      
      {#if scanning && !isVerifying}
        <div class="scan-line"></div>
      {/if}
    {/if}
  </div>
  
  <button 
    class="btn-simulate" 
    on:click={simulateScan}
    disabled={isVerifying}
  >
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
    {lang === 'th' ? 'จำลองการสแกน' : 'Simulate Scan'}
  </button>
</div>

<style>
  .qr-scanner { display: flex; flex-direction: column; align-items: center; gap: 1.5rem; }
  
  .scanner-header { text-align: center; }
  .scanner-title { font-size: 1.25rem; font-weight: 600; color: var(--text); margin: 0 0 0.5rem; }
  .scanner-desc { font-size: 0.875rem; color: var(--text-muted); margin: 0; }
  
  .camera-container { position: relative; width: 100%; max-width: 400px; aspect-ratio: 1; border-radius: 12px; overflow: hidden; background: #000; }
  
  .camera-video { width: 100%; height: 100%; object-fit: cover; }
  .camera-canvas { display: none; }
  
  .camera-error { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: white; gap: 1rem; padding: 2rem; text-align: center; }
  .camera-error svg { width: 48px; height: 48px; }
  
  .scan-frame { position: absolute; inset: 20%; pointer-events: none; }
  .corner { position: absolute; width: 40px; height: 40px; border: 3px solid var(--primary); }
  .corner-tl { top: 0; left: 0; border-right: none; border-bottom: none; }
  .corner-tr { top: 0; right: 0; border-left: none; border-bottom: none; }
  .corner-bl { bottom: 0; left: 0; border-right: none; border-top: none; }
  .corner-br { bottom: 0; right: 0; border-left: none; border-top: none; }
  
  .scan-line { position: absolute; top: 20%; left: 20%; right: 20%; height: 2px; background: var(--primary); box-shadow: 0 0 10px var(--primary); animation: scan 2s ease-in-out infinite; }
  @keyframes scan { 0%, 100% { top: 20%; } 50% { top: 80%; } }
  
  .btn-simulate { display: flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; background: var(--bg-alt); border: 1px solid var(--border); border-radius: 8px; font-size: 0.875rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
  .btn-simulate:hover:not(:disabled) { background: var(--bg-hover); border-color: var(--primary); }
  .btn-simulate:disabled { opacity: 0.5; cursor: not-allowed; }
  .btn-simulate svg { width: 18px; height: 18px; }
</style>