import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

/**
 * Layout Load Function
 * 
 * This runs on every navigation to /organizer/*
 * Handles:
 * - Authentication check
 * - Token validation
 * - Redirect to login if not authenticated
 */
export const load: LayoutLoad = async ({ url, fetch }) => {
  // ==========================================
  // 🔒 AUTHENTICATION CHECK
  // ==========================================
  
  // Check if running in browser
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname || url.pathname;

    // If we're already on an auth page, don't try to redirect again
    if (currentPath.startsWith('/auth')) {
      return {
        timestamp: new Date().toISOString(),
      };
    }

    const accessToken = localStorage.getItem('access_token');
    const refreshToken = localStorage.getItem('refresh_token');

    // No tokens = not authenticated
    if (!accessToken || !refreshToken) {
      console.warn('🔒 No auth tokens found - redirecting to login');
      throw redirect(303, '/auth/login');
    }
    
    // Validate token structure (basic check)
    try {
      const tokenParts = accessToken.split('.');
      if (tokenParts.length !== 3) {
        console.error('❌ Invalid token format - redirecting to login');
        localStorage.clear();
        sessionStorage.clear();
        throw redirect(303, '/auth/login');  // ← แก้ตรงนี้
      }
      
      // Decode JWT payload to check expiry
      const payload = JSON.parse(atob(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')));
      const now = Math.floor(Date.now() / 1000);
      
      // Token expired
        if (payload.exp && payload.exp < now) {
        console.warn('⏰ Token expired - redirecting to login');
        localStorage.clear();
        sessionStorage.clear();
        if (!currentPath.startsWith('/auth')) throw redirect(303, '/auth/login');
      }
      
      console.log('✅ Auth check passed');
      
    } catch (error) {
      console.error('❌ Token validation error:', error);
      localStorage.clear();
      sessionStorage.clear();
      if (!currentPath.startsWith('/auth')) throw redirect(303, '/auth/login');
    }
  }
  
  // ==========================================
  // 📊 LOAD INITIAL DATA (Optional)
  // ==========================================
  
  return {
    timestamp: new Date().toISOString(),
  };
};

export const ssr = false;
export const prerender = false;