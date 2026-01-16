<script lang="ts">
  import { onMount } from 'svelte';
  import { verifyProof, pendingCount, approvedCount, rejectedCount } from '../_lib/stores/verifyProof';
  import { appState } from '../_lib/stores/appState';
  import api from '../_lib/api/client';
  import { endpoints } from '../_lib/api/endpoints';
  import { t } from '../_lib/i18n';
  import LoadingSpinner from '../_lib/components/LoadingSpinner.svelte';
  import ErrorMessage from '../_lib/components/ErrorMessage.svelte';
  import SuccessAlert from '../_lib/components/SuccessAlert.svelte';
  import ProofCard from './_components/ProofCard.svelte';
  import ProofFilters from './_components/ProofFilters.svelte';
  import ApprovalModal from './_components/ApprovalModal.svelte';
  import RejectionModal from './_components/RejectionModal.svelte';
  
  $: lang = $appState.currentLang;
  
  let isLoading = true;
  let errorMessage = '';
  let successMessage = '';
  let selectedProof: any = null;
  let showApprovalModal = false;
  let showRejectionModal = false;
  
  // Filters
  let statusFilter = 'pending';
  let eventFilter = 'all';
  let dateFilter = '';
  
  // Pagination
  let currentPage = 1;
  let pageSize = 12;
  
  $: filteredProofs = filterProofs($verifyProof.submissions, statusFilter, eventFilter, dateFilter);
  $: paginatedProofs = paginateProofs(filteredProofs, currentPage, pageSize);
  $: totalPages = Math.ceil(filteredProofs.length / pageSize);
  
  function filterProofs(proofs: any[], status: string, event: string, date: string) {
    return proofs.filter(proof => {
      if (status !== 'all' && proof.status !== status) return false;
      if (event !== 'all' && proof.eventId?.toString() !== event) return false;
      if (date && !proof.submittedAt.startsWith(date)) return false;
      return true;
    });
  }
  
  function paginateProofs(proofs: any[], page: number, size: number) {
    const start = (page - 1) * size;
    return proofs.slice(start, start + size);
  }
  
  async function loadProofs() {
    isLoading = true;
    errorMessage = '';
    
    try {
      const response = await api.get(endpoints.proofs.list);
      verifyProof.setSubmissions(response.data);
    } catch (error: any) {
      errorMessage = error.response?.data?.message || (lang === 'th' ? 'โหลดข้อมูลล้มเหลว' : 'Failed to load submissions');
      console.error('Error loading proofs:', error);
    } finally {
      isLoading = false;
    }
  }
  
  function handleApprove(proof: any) {
    selectedProof = proof;
    showApprovalModal = true;
  }
  
  function handleReject(proof: any) {
    selectedProof = proof;
    showRejectionModal = true;
  }
  
  async function handleApprovalConfirm(data: { points: number; message: string }) {
    if (!selectedProof) return;
    
    try {
      await api.post(endpoints.proofs.approve(selectedProof.id), data);
      successMessage = lang === 'th' ? 'อนุมัติสำเร็จ' : 'Approved successfully';
      await loadProofs();
      showApprovalModal = false;
      selectedProof = null;
    } catch (error: any) {
      errorMessage = error.response?.data?.message || (lang === 'th' ? 'อนุมัติล้มเหลว' : 'Failed to approve');
    }
  }
  
  async function handleRejectionConfirm(data: { reason: string }) {
    if (!selectedProof) return;
    
    try {
      await api.post(endpoints.proofs.reject(selectedProof.id), data);
      successMessage = lang === 'th' ? 'ปฏิเสธสำเร็จ' : 'Rejected successfully';
      await loadProofs();
      showRejectionModal = false;
      selectedProof = null;
    } catch (error: any) {
      errorMessage = error.response?.data?.message || (lang === 'th' ? 'ปฏิเสธล้มเหลว' : 'Failed to reject');
    }
  }
  
  onMount(() => {
    loadProofs();
  });
</script>

<div class="verify-proof-page">
  <div class="page-header">
    <div class="header-left">
      <h1 class="page-title">{t('verifyProof')}</h1>
      <p class="page-subtitle">
        {lang === 'th' ? 'ตรวจสอบและอนุมัติหลักฐานการเข้าร่วม' : 'Review and approve participation proofs'}
      </p>
    </div>
    
    <div class="header-stats">
      <div class="stat-badge pending">
        <span class="stat-count">{$pendingCount}</span>
        <span class="stat-label">{lang === 'th' ? 'รอตรวจ' : 'Pending'}</span>
      </div>
      <div class="stat-badge approved">
        <span class="stat-count">{$approvedCount}</span>
        <span class="stat-label">{lang === 'th' ? 'อนุมัติ' : 'Approved'}</span>
      </div>
      <div class="stat-badge rejected">
        <span class="stat-count">{$rejectedCount}</span>
        <span class="stat-label">{lang === 'th' ? 'ปฏิเสธ' : 'Rejected'}</span>
      </div>
    </div>
  </div>
  
  <ProofFilters
    bind:statusFilter
    bind:eventFilter
    bind:dateFilter
  />
  
  {#if successMessage}
    <SuccessAlert message={successMessage} autoDismiss={true} />
  {/if}
  
  {#if errorMessage}
    <ErrorMessage message={errorMessage} onDismiss={() => errorMessage = ''} />
  {/if}
  
  {#if isLoading}
    <LoadingSpinner size="lg" />
  {:else if filteredProofs.length === 0}
    <div class="empty-state">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3>{lang === 'th' ? 'ไม่พบข้อมูล' : 'No Submissions'}</h3>
      <p>{lang === 'th' ? 'ไม่มีหลักฐานที่ตรงกับเงื่อนไข' : 'No submissions match the filters'}</p>
    </div>
  {:else}
    <div class="results-info">
      <span>
        {lang === 'th' ? 'แสดง' : 'Showing'} 
        <strong>{paginatedProofs.length}</strong> 
        {lang === 'th' ? 'จาก' : 'of'} 
        <strong>{filteredProofs.length}</strong> 
        {lang === 'th' ? 'รายการ' : 'items'}
      </span>
    </div>
    
    <div class="proofs-grid">
      {#each paginatedProofs as proof (proof.id)}
        <ProofCard 
          {proof}
          onApprove={() => handleApprove(proof)}
          onReject={() => handleReject(proof)}
        />
      {/each}
    </div>
    
    {#if totalPages > 1}
      <div class="pagination">
        <button 
          class="pagination-btn" 
          disabled={currentPage === 1}
          on:click={() => currentPage--}
        >
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          {lang === 'th' ? 'ก่อนหน้า' : 'Previous'}
        </button>
        
        <div class="page-numbers">
          {#each Array(totalPages) as _, i}
            {#if i < 3 || i >= totalPages - 3 || Math.abs(i + 1 - currentPage) <= 1}
              <button
                class="page-number"
                class:active={currentPage === i + 1}
                on:click={() => currentPage = i + 1}
              >
                {i + 1}
              </button>
            {:else if i === 3 || i === totalPages - 4}
              <span class="ellipsis">...</span>
            {/if}
          {/each}
        </div>
        
        <button 
          class="pagination-btn" 
          disabled={currentPage === totalPages}
          on:click={() => currentPage++}
        >
          {lang === 'th' ? 'ถัดไป' : 'Next'}
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    {/if}
  {/if}
</div>

<ApprovalModal
  show={showApprovalModal}
  proof={selectedProof}
  onConfirm={handleApprovalConfirm}
  onCancel={() => {
    showApprovalModal = false;
    selectedProof = null;
  }}
/>

<RejectionModal
  show={showRejectionModal}
  proof={selectedProof}
  onConfirm={handleRejectionConfirm}
  onCancel={() => {
    showRejectionModal = false;
    selectedProof = null;
  }}
/>

<style>
  .verify-proof-page { max-width: 1400px; margin: 0 auto; padding: 2rem; }
  
  .page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; gap: 1.5rem; }
  .header-left { flex: 1; }
  .page-title { font-size: 2rem; font-weight: 700; color: var(--text); margin: 0; }
  .page-subtitle { font-size: 0.875rem; color: var(--text-muted); margin: 0.5rem 0 0; }
  
  .header-stats { display: flex; gap: 1rem; }
  .stat-badge { display: flex; flex-direction: column; align-items: center; padding: 0.75rem 1.25rem; border-radius: 8px; min-width: 80px; }
  .stat-badge.pending { background: #fef3c7; border: 1px solid #fbbf24; }
  .stat-badge.approved { background: #d1fae5; border: 1px solid #10b981; }
  .stat-badge.rejected { background: #fee2e2; border: 1px solid #ef4444; }
  .stat-count { font-size: 1.5rem; font-weight: 700; color: var(--text); }
  .stat-label { font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; }
  
  .results-info { padding: 0.75rem 0; margin-bottom: 1rem; font-size: 0.875rem; color: var(--text-muted); }
  .results-info strong { color: var(--text); font-weight: 600; }
  
  .proofs-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
  
  .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 4rem 2rem; text-align: center; }
  .empty-state svg { width: 80px; height: 80px; color: var(--text-light); opacity: 0.5; margin-bottom: 1.5rem; }
  .empty-state h3 { font-size: 1.25rem; font-weight: 600; color: var(--text); margin: 0 0 0.5rem; }
  .empty-state p { font-size: 0.875rem; color: var(--text-muted); margin: 0; }
  
  .pagination { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-top: 2rem; padding-top: 2rem; border-top: 1px solid var(--border); }
  .pagination-btn { display: flex; align-items: center; gap: 0.5rem; padding: 0.625rem 1rem; background: white; border: 1px solid var(--border); border-radius: 8px; font-size: 0.875rem; cursor: pointer; }
  .pagination-btn:hover:not(:disabled) { background: var(--bg-alt); border-color: var(--primary); }
  .pagination-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .pagination-btn svg { width: 16px; height: 16px; }
  .page-numbers { display: flex; gap: 0.25rem; }
  .page-number { min-width: 36px; height: 36px; padding: 0 0.5rem; background: white; border: 1px solid var(--border); border-radius: 6px; font-size: 0.875rem; cursor: pointer; }
  .page-number:hover { background: var(--bg-alt); }
  .page-number.active { background: var(--primary); color: white; border-color: var(--primary); }
  .ellipsis { padding: 0 0.5rem; color: var(--text-muted); }
  
  @media (max-width: 768px) {
    .verify-proof-page { padding: 1rem; }
    .page-header { flex-direction: column; align-items: stretch; }
    .header-stats { justify-content: space-between; }
    .proofs-grid { grid-template-columns: 1fr; }
    .pagination { flex-direction: column; }
    .page-numbers { order: -1; margin-bottom: 1rem; }
  }
</style>