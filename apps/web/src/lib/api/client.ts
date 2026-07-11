import axios, { AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
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

// Endpoints that must NOT carry a Bearer token (they're called before the user
// has a session, or explicitly use the httpOnly refresh cookie instead).
// `logout` is deliberately excluded — the backend's JwtAuthGuard requires the
// current access token to identify which session/refresh-token to revoke.
// Sending it Authorization-less always returned 401 and skipped server-side
// session revocation entirely.
const isAuthBootstrapEndpoint = (url?: string): boolean => {
  if (!url) return false;
  return /\/auth\/(login|register|supabase|verify-email|forgot-password|reset-password|refresh|oauth-token-exchange)/.test(
    url,
  );
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
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// Add access token to requests — never on auth bootstrap (refresh must use cookie only).
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const url = String(config.url || '');
    if (isAuthBootstrapEndpoint(url)) {
      if (config.headers) {
        delete (config.headers as any).Authorization;
        delete (config.headers as any).authorization;
      }
      return config;
    }
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

// Single-flight refresh + grace window.
// Backend rotates refresh cookies; a second concurrent refresh with the old
// cookie returns 401 and would otherwise wipe a healthy session.
let refreshPromise: Promise<string> | null = null;
let lastRefreshAt = 0;
let logoutInFlight = false;
const REFRESH_GRACE_MS = 12_000;

export function refreshSession(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  // Recent successful refresh — reuse token instead of rotating again.
  const existing = useAuthStore.getState().accessToken;
  if (existing && Date.now() - lastRefreshAt < REFRESH_GRACE_MS) {
    return Promise.resolve(existing);
  }

  const postRefresh = () =>
    apiClient.post('/auth/refresh', {}, { withCredentials: true });

  refreshPromise = (async () => {
    let response;
    try {
      response = await postRefresh();
    } catch (err) {
      const status = (err as AxiosError)?.response?.status;
      // A cookie-rotation race (see comment above) can 401 a refresh that
      // would have succeeded a moment later once the browser's cookie jar
      // catches up with a rotation from another in-flight request. Retry
      // once before treating the session as genuinely dead — forcing a
      // logout on the first failure was punishing a transient race, not a
      // real expiry.
      if (status !== 401 && status !== 403) throw err;
      await new Promise((resolve) => setTimeout(resolve, 600));
      response = await postRefresh();
    }
    const data = unwrapApiResponse<{ accessToken: string }>(response.data);
    const accessToken = data.accessToken;

    useAuthStore.getState().setToken(accessToken);
    lastRefreshAt = Date.now();
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
        useAuthStore.setState({ user, isAuthenticated: true });
      }
    } catch {
      /* optional profile sync */
    }

    return accessToken;
  })();

  void refreshPromise.finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

function isSessionSupersededError(error: unknown): boolean {
  const code = (error as AxiosError<{ code?: string }>)?.response?.data?.code;
  return code === 'SESSION_SUPERSEDED';
}

function forceLoginRedirect(reason: 'expired' | 'superseded' = 'expired') {
  if (logoutInFlight) return;
  logoutInFlight = true;
  useAuthStore.getState().clearAuth();
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem('profytron_force_login', '1');
  } catch {
    /* ignore */
  }
  const currentPath = window.location.pathname;
  if (!currentPath.startsWith('/login') && !currentPath.startsWith('/register')) {
    const redirect = encodeURIComponent(
      `${currentPath}${window.location.search || ''}`,
    );
    const reasonParam = reason === 'superseded' ? 'superseded=true' : 'expired=true';
    window.location.replace(`/login?${reasonParam}&redirect=${redirect}`);
  }
  window.setTimeout(() => {
    logoutInFlight = false;
  }, 5000);
}

// Handle 401 Unauthorized for Token Refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    const requestUrl = originalRequest?.url as string | undefined;

    if (error.response?.status === 401 && isSessionSupersededError(error)) {
      // Refreshing here would just mint a fresh token that still isn't the
      // active claim — go straight to a (clearly-labeled) forced logout
      // instead of retrying.
      forceLoginRedirect('superseded');
      return Promise.reject(error);
    }

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
        const refreshStatus = (refreshError as AxiosError)?.response?.status;
        const isAuthRejection = refreshStatus === 401 || refreshStatus === 403;
        if (!isAuthRejection || isNetworkUnavailableError(refreshError)) {
          return Promise.reject(refreshError);
        }
        forceLoginRedirect();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);
