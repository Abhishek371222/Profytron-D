import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/useAuthStore';

const isAuthBootstrapEndpoint = (url?: string): boolean => {
  if (!url) return false;
  return /\/auth\/(login|register|supabase|verify-email|forgot-password|reset-password|refresh|logout)/.test(url);
};

const isNetworkUnavailableError = (error: unknown): boolean => {
  const candidate = error as { code?: string; message?: string; response?: unknown };
  const message = candidate?.message || '';
  return (
    !candidate?.response &&
    (candidate?.code === 'ECONNREFUSED' ||
      candidate?.code === 'ERR_NETWORK' ||
      message.includes('ECONNREFUSED') ||
      message.includes('Network Error'))
  );
};

export const apiClient = axios.create({
  // Use same-origin /api so Next.js rewrites to backend /v1 in dev.
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add access token to requests
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

// Handle 401 Unauthorized for Token Refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    const tokenInStore = useAuthStore.getState().accessToken;
    const requestToken = originalRequest?.headers?.Authorization;
    const hasAuthContext = Boolean(tokenInStore || requestToken);
    const requestUrl = originalRequest?.url as string | undefined;
    
    // Check if the error is 401 and we haven't already retried
    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      hasAuthContext &&
      !isAuthBootstrapEndpoint(requestUrl)
    ) {
      originalRequest._retry = true;
      
      try {
        const { data } = await axios.post(
            `${apiClient.defaults.baseURL}/auth/refresh`,
            {},
            { withCredentials: true }
        );
        
        // Update global auth store with new token to reflect in future requests
        useAuthStore.getState().setToken(data.accessToken);
        
        // Retry original request 
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If backend is temporarily down, keep client auth state and avoid false "session expired" redirects.
        if (isNetworkUnavailableError(refreshError)) {
          return Promise.reject(refreshError);
        }

        // Refresh genuinely failed (token/cookie invalid), clear auth and redirect to login.
        useAuthStore.getState().clearAuth();
        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname;
          if (!currentPath.startsWith('/login')) {
            window.location.href = '/login?expired=true';
          }
        }
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
