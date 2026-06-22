import axios, { AxiosRequestConfig, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../stores/useAuthStore';
import { isAdminUser } from '../utils';

const isMockApiEnabled = process.env.NEXT_PUBLIC_ENABLE_MOCK_API === 'true';
const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
const apiBaseURL = isMockApiEnabled
  ? '/api'
  : configuredApiUrl && configuredApiUrl.startsWith('/')
    ? configuredApiUrl
    : '/api';

export const unwrapApiResponse = <T>(payload: any): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }
  return payload as T;
};

const isAuthBootstrapEndpoint = (url?: string): boolean => {
  if (!url) return false;
  return /\/auth\/(login|register|supabase|verify-email|forgot-password|reset-password|refresh|logout|oauth-token-exchange)/.test(url);
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
  baseURL: apiBaseURL,
  // 30 s is generous enough for trading order endpoints while still catching
  // genuinely hung connections (e.g. broker relay timeouts).
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
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

// Single-flight refresh. On a hard page reload the dashboard fires many
// requests at once; each gets a 401 from the expired access token. Because the
// backend ROTATES the refresh token on every /auth/refresh (and blacklists the
// previous one), letting each 401 trigger its own refresh causes a race: the
// first call rotates the token and the rest send the now-invalid one, getting a
// genuine 401 and logging the user out. We dedupe all concurrent refreshes into
// one shared promise so the token is rotated exactly once.
let refreshPromise: Promise<string> | null = null;

function refreshSession(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const response = await apiClient.post(
      '/auth/refresh',
      {},
      { withCredentials: true },
    );
    const data = unwrapApiResponse<{ accessToken: string }>(response.data);
    const accessToken = data.accessToken;

    useAuthStore.getState().setToken(accessToken);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('profytron_access', accessToken);
    }

    try {
      const { reconnectTradingSocket } = await import(
        '@/lib/realtime/trading-socket'
      );
      reconnectTradingSocket(accessToken);
    } catch {
      /* socket optional */
    }

    try {
      const meRes = await apiClient.get('/users/me', {
        headers: { Authorization: `Bearer ${accessToken}` },
        // Prevent this profile sync from re-entering the refresh flow.
        _retry: true,
      } as any);
      const user = unwrapApiResponse<any>(meRes.data);
      if (typeof window !== 'undefined' && user) {
        const onboardingFlag =
          isAdminUser(user) || user.onboardingCompleted ? '1' : '0';
        document.cookie = `onboarding_completed=${onboardingFlag}; path=/; max-age=7776000; samesite=lax`;
        if (user.role) {
          document.cookie = `user_role=${user.role}; path=/; max-age=7776000; samesite=lax`;
        }
        useAuthStore.setState({ user });
      }
    } catch {
      /* optional profile sync */
    }

    return accessToken;
  })();

  // Allow a fresh refresh once this one fully settles.
  void refreshPromise.finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

// Handle 401 Unauthorized for Token Refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    const requestUrl = originalRequest?.url as string | undefined;

    // Check if the error is 401 and we haven't already retried.
    // We can still attempt session refresh when the client has no token in memory,
    // because a valid HttpOnly refresh cookie may still exist for the user.
    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !isAuthBootstrapEndpoint(requestUrl)
    ) {
      originalRequest._retry = true;

      try {
        const accessToken = await refreshSession();

        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${accessToken}`,
        };
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Only a genuine auth rejection from the refresh endpoint means the
        // session is actually invalid/expired. Transient failures — network
        // errors, timeouts, or 5xx (e.g. the API cold-starting on a free host
        // after idle) — must NOT log the user out, or a valid session gets
        // killed just because the backend was briefly unreachable. Keep the
        // session and let the caller retry once the backend is back.
        const refreshStatus = (refreshError as AxiosError)?.response?.status;
        const isAuthRejection = refreshStatus === 401 || refreshStatus === 403;
        if (!isAuthRejection || isNetworkUnavailableError(refreshError)) {
          return Promise.reject(refreshError);
        }

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
