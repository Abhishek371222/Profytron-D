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

function readJwtExpMs(token: string | null | undefined): number | null {
  if (!token) return null;
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = JSON.parse(
      atob(payload.replace(/-/g, '+').replace(/_/g, '/')),
    ) as { exp?: number };
    return typeof json.exp === 'number' ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

/** True when access JWT is missing or expires within the next 60s. */
export function isAccessTokenStale(token: string | null | undefined): boolean {
  const exp = readJwtExpMs(token);
  if (exp == null) return true;
  return exp <= Date.now() + 60_000;
}

export const apiClient = axios.create({
  baseURL: apiBaseURL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

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
// cookie returns 401/SESSION_SUPERSEDED and would wipe a healthy session.
let refreshPromise: Promise<string> | null = null;
let lastRefreshAt = 0;
let logoutInFlight = false;
const REFRESH_GRACE_MS = 15_000;

async function postRefreshOnce() {
  return apiClient.post('/auth/refresh', {}, { withCredentials: true });
}

async function applyRefreshedAccessToken(accessToken: string): Promise<string> {
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

  // Optional profile sync — never fail the refresh because /me is slow/down.
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
    /* optional */
  }

  return accessToken;
}

export function refreshSession(): Promise<string> {
  // Assign immediately so parallel 401 handlers share one flight.
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const existing = useAuthStore.getState().accessToken;
    if (
      existing &&
      !isAccessTokenStale(existing) &&
      Date.now() - lastRefreshAt < REFRESH_GRACE_MS
    ) {
      return existing;
    }
    // After a winning refresh, even a slightly-stale grace token is better than
    // rotating again and risking SESSION_SUPERSEDED.
    if (existing && Date.now() - lastRefreshAt < REFRESH_GRACE_MS) {
      return existing;
    }

    let response;
    try {
      response = await postRefreshOnce();
    } catch (err) {
      const status = (err as AxiosError)?.response?.status;
      const code = (err as AxiosError<{ code?: string }>)?.response?.data?.code;

      // Another request won the cookie rotation — reuse its token if present.
      if (
        status === 401 &&
        (code === 'SESSION_SUPERSEDED' || code === 'INVALID_REFRESH_SESSION')
      ) {
        await new Promise((r) => setTimeout(r, 500));
        const winner = useAuthStore.getState().accessToken;
        if (winner && Date.now() - lastRefreshAt < REFRESH_GRACE_MS) {
          return winner;
        }
        // Cookie jar may have the new refresh now — one more try.
        try {
          response = await postRefreshOnce();
        } catch (retryErr) {
          throw retryErr;
        }
      } else if (status === 401 || status === 403) {
        await new Promise((r) => setTimeout(r, 600));
        response = await postRefreshOnce();
      } else {
        throw err;
      }
    }

    const data = unwrapApiResponse<{ accessToken: string }>(response.data);
    return applyRefreshedAccessToken(data.accessToken);
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
  // Never bounce during hydrate — AuthProvider finishes the overlay and
  // routes to login without a hard redirect race.
  if (useAuthStore.getState().isHydrating) return;

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

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    const requestUrl = originalRequest?.url as string | undefined;

    if (error.response?.status === 401 && isSessionSupersededError(error)) {
      // Non-refresh 401 with SESSION_SUPERSEDED is rare; try to recover via
      // single-flight refresh before hard logout.
      if (!originalRequest?._retry && !isAuthBootstrapEndpoint(requestUrl)) {
        originalRequest._retry = true;
        try {
          const accessToken = await refreshSession();
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${accessToken}`,
          };
          return apiClient(originalRequest);
        } catch {
          forceLoginRedirect('superseded');
          return Promise.reject(error);
        }
      }
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
