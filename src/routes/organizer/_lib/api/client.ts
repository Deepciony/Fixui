import axios, { type AxiosError, type AxiosInstance } from 'axios';
import { goto } from '$app/navigation';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

function decodeJwtPayload(token: string): any | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = payload.length % 4;
    if (pad) payload += '='.repeat(4 - pad);
    const json = atob(payload);
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    (config as any).__retryCount = (config as any).__retryCount || 0;
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as any;

    if (error.response?.status) {
      const status = error.response.status;
      
      if (status === 401 || status === 403) {
        console.error(`❌ API Error ${status} - Force logout and redirect`);
        
        if (typeof localStorage !== 'undefined') {
          localStorage.clear();
        }
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.clear();
        }
        
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        
        return Promise.reject(error);
      }
      
      console.warn(`⚠️ API Error ${status}: ${error.response?.statusText || 'Unknown'}`);
      return Promise.reject(error);
    }

    const isNetworkError = !error.response && error.code === 'ECONNABORTED';

    if (isNetworkError && config && config.__retryCount < MAX_RETRIES) {
      config.__retryCount += 1;
      console.warn(
        `🔄 Retry attempt ${config.__retryCount}/${MAX_RETRIES} for ${config.url} (network error)`
      );

      await delay(RETRY_DELAY * config.__retryCount);
      return api(config);
    }

    console.error('❌ Network error:', error.message || 'Unknown network error');
    return Promise.reject(error);
  }
);

export default api;