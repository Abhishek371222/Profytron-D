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

const isAuthBootstrapEndpoint = (url?: string): boolean => {
  if (!url) return false;
  return /\/auth\/(login|register|supabase|firebase|verify-email|forgot-password|reset-password|refresh|oauth-token-exchange)/.test(
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

let refreshPromise: Promise<string> | null = null;
let lastRefreshAt = 0;
let logoutInFlight = false;
const REFRESH_GRACE_MS = 15_000;

async function postRefreshOnce() {
  return apiClient.post(
    '/auth/refresh',
    {},
    { withCredentials: true, timeout: 20_000 },
  );
}

function isMissingRefreshSessionError(error: unknown): boolean {
  const axiosErr = error as AxiosError<{ code?: string; message?: string }>;
  const status = axiosErr?.response?.status;
  if (status !== 401 && status !== 403) return false;
  const code = axiosErr?.response?.data?.code;
  return (
    code === 'INTERNAL_ERROR' ||
    code === 'INVALID_REFRESH_SESSION' ||
    !code
  );
}

function isTransientRefreshFailure(error: unknown): boolean {
  const axiosErr = error as AxiosError;
  const status = axiosErr?.response?.status;
  const code = axiosErr?.code;
  if (isNetworkUnavailableError(error)) return true;
  if (code === 'ECONNABORTED' || code === 'ETIMEDOUT') return true;
  if (status === 500 || status === 502 || status === 503 || status === 504) {
    return true;
  }
  return false;
}

async function applyRefreshedAccessToken(accessToken: string): Promise<string> {
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
  }

  try {
    const { reconnectAccountSnapshotSocket } = await import(
      '@/lib/realtime/account-snapshot-socket'
    );
    reconnectAccountSnapshotSocket(accessToken);
  } catch {
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
    }
    useAuthStore.setState({ accessToken, user, isAuthenticated: true });
  } catch (meError) {
    const status = (meError as AxiosError)?.response?.status;
    if (status === 401 || status === 403) {
      throw meError;
    }
    useAuthStore.getState().setToken(accessToken);
  }

  return accessToken;
}

export function refreshSession(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  const existing = useAuthStore.getState().accessToken;
  if (
    existing &&
    !isAccessTokenStale(existing) &&
    Date.now() - lastRefreshAt < REFRESH_GRACE_MS
  ) {
    return Promise.resolve(existing);
  }
  if (existing && Date.now() - lastRefreshAt < REFRESH_GRACE_MS) {
    return Promise.resolve(existing);
  }

  const pending = (async () => {
    let response;
    try {
      response = await postRefreshOnce();
    } catch (err) {
      const status = (err as AxiosError)?.response?.status;
      const code = (err as AxiosError<{ code?: string }>)?.response?.data?.code;

      if (
        (status === 401 || status === 403) &&
        !useAuthStore.getState().accessToken &&
        isMissingRefreshSessionError(err)
      ) {
        throw err;
      }

      if (
        status === 401 &&
        (code === 'SESSION_SUPERSEDED' || code === 'INVALID_REFRESH_SESSION')
      ) {
        await new Promise((r) => setTimeout(r, 500));
        const winner = useAuthStore.getState().accessToken;
        if (winner && Date.now() - lastRefreshAt < REFRESH_GRACE_MS) {
          return winner;
        }
        response = await postRefreshOnce();
      } else if (status === 401 || status === 403) {
        await new Promise((r) => setTimeout(r, 600));
        response = await postRefreshOnce();
      } else if (isTransientRefreshFailure(err)) {
        await new Promise((r) => setTimeout(r, 800));
        response = await postRefreshOnce();
      } else {
        throw err;
      }
    }

    const data = unwrapApiResponse<{ accessToken: string }>(response.data);
    return applyRefreshedAccessToken(data.accessToken);
  })();

  refreshPromise = pending;
  void pending
    .finally(() => {
      if (refreshPromise === pending) {
        refreshPromise = null;
      }
    })
    .catch(() => undefined);
  return pending;
}

function isSessionSupersededError(error: unknown): boolean {
  const code = (error as AxiosError<{ code?: string }>)?.response?.data?.code;
  return code === 'SESSION_SUPERSEDED';
}

function forceLoginRedirect(reason: 'expired' | 'superseded' = 'expired') {
  if (useAuthStore.getState().isHydrating) return;

  if (logoutInFlight) return;
  logoutInFlight = true;
  useAuthStore.getState().clearAuth();
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem('profytron_force_login', '1');
  } catch {
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

function silentAuthReject(error: AxiosError) {
  const quiet = new Error(
    (error.response?.data as { message?: string })?.message ||
      'Session ended',
  ) as Error & {
    isAxiosError?: boolean;
    silentAuth?: boolean;
    response?: AxiosError['response'];
  };
  quiet.name = 'SessionEndedError';
  quiet.silentAuth = true;
  quiet.isAxiosError = false;
  quiet.response = error.response;
  return Promise.reject(quiet);
}

apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;
    const requestUrl = originalRequest?.url as string | undefined;

    if (
      (error.response?.status === 401 || error.response?.status === 403) &&
      isAuthBootstrapEndpoint(requestUrl)
    ) {
      return silentAuthReject(error);
    }

    if (error.response?.status === 401 && isSessionSupersededError(error)) {
      if (!originalRequest?._retry && !isAuthBootstrapEndpoint(requestUrl)) {
        originalRequest._retry = true;
        try {
          const accessToken = await refreshSession();
          originalRequest.headers = {
            ...originalRequest.headers,
            Authorization: `Bearer ${accessToken}`,
          };
          return await apiClient(originalRequest);
        } catch {
          forceLoginRedirect('superseded');
          return silentAuthReject(error);
        }
      }
      forceLoginRedirect('superseded');
      return silentAuthReject(error);
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
        return await apiClient(originalRequest);
      } catch (refreshError) {
        const refreshStatus = (refreshError as AxiosError)?.response?.status;
        const isAuthRejection = refreshStatus === 401 || refreshStatus === 403;
        if (!isAuthRejection || isNetworkUnavailableError(refreshError)) {
          return Promise.reject(refreshError);
        }
        forceLoginRedirect();
        return silentAuthReject(error);
      }
    }

    return Promise.reject(error);
  },
);
