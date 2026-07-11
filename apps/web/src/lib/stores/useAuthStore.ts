import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  apiClient,
  unwrapApiResponse,
  refreshSession,
  isAccessTokenStale,
} from '../api/client';
import { authApi } from '../api/auth';
import { isAdminUser } from '../utils';

const isMockApiEnabled = process.env.NEXT_PUBLIC_ENABLE_MOCK_API === 'true';
const SESSION_TOKEN_KEY = 'profytron_access';
const FORCE_LOGIN_KEY = 'profytron_force_login';

type User = any;

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrating: boolean;
  setAuth: (user: User, accessToken: string) => void;
  setToken: (token: string) => void;
  clearAuth: () => void;
  login: (accessToken: string, user: User) => void;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

function syncUserCookies(user: User | null | undefined) {
  if (typeof window === 'undefined' || !user) return;
  const onboardingFlag =
    isAdminUser(user) || user.onboardingCompleted ? '1' : '0';
  document.cookie = `onboarding_completed=${onboardingFlag}; path=/; max-age=7776000; samesite=lax`;
  if (user.role) {
    document.cookie = `user_role=${user.role}; path=/; max-age=7776000; samesite=lax`;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrating: true,
      setAuth: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
      setToken: (accessToken) => set({ accessToken, isAuthenticated: true }),
      clearAuth: () => {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(SESSION_TOKEN_KEY);
          document.cookie = 'demo_access=; path=/; max-age=0; samesite=lax';
          document.cookie = 'onboarding_completed=; path=/; max-age=0; samesite=lax';
          document.cookie = 'user_role=; path=/; max-age=0; samesite=lax';
        }
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
          isHydrating: false,
        });
      },
      login: (accessToken, user) => {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(SESSION_TOKEN_KEY, accessToken);
          sessionStorage.removeItem(FORCE_LOGIN_KEY);
          if (accessToken.startsWith('mock_token_')) {
            document.cookie = 'demo_access=1; path=/; max-age=86400; samesite=lax';
          }
          syncUserCookies(user);
          if (user?.id && window.posthog) {
            window.posthog.identify(user.id, { email: user.email, name: user.fullName });
          }
        }
        set({ user, accessToken, isAuthenticated: true, isLoading: false, isHydrating: false });
      },
      logout: async () => {
        set({ isLoading: true });
        try {
          await authApi.logout();
        } catch {
          console.warn('Logout API call did not complete; purging client session anyway.');
        }
        get().clearAuth();
      },
      hydrate: async () => {
        if (isMockApiEnabled) {
          set((state) => ({ isAuthenticated: Boolean(state.user), isHydrating: false }));
          return;
        }

        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const forcedLogin = sessionStorage.getItem(FORCE_LOGIN_KEY) === '1';
          if (
            forcedLogin ||
            params.get('expired') === 'true' ||
            params.get('expired') === '1' ||
            params.get('idle') === 'true' ||
            params.get('superseded') === 'true'
          ) {
            sessionStorage.removeItem(FORCE_LOGIN_KEY);
            sessionStorage.removeItem(SESSION_TOKEN_KEY);
            set({
              user: null,
              accessToken: null,
              isAuthenticated: false,
              isHydrating: false,
            });
            return;
          }
        }

        set({ isHydrating: true, isAuthenticated: false });

        const tryMe = async (token: string, opts?: { allowRefresh?: boolean }) => {
          const meRes = await apiClient.get('/users/me', {
            headers: { Authorization: `Bearer ${token}` },
            // After a successful cookie refresh, don't rotate again on /me failure.
            _retry: !opts?.allowRefresh,
          } as any);
          return unwrapApiResponse<User>(meRes.data);
        };

        const memoryToken = get().accessToken;
        const sessionToken =
          typeof window !== 'undefined' ? sessionStorage.getItem(SESSION_TOKEN_KEY) : null;
        const bootstrapToken = memoryToken || sessionToken;

        // Fresh access token → validate profile without rotating cookies.
        if (bootstrapToken && !isAccessTokenStale(bootstrapToken)) {
          try {
            const user = await tryMe(bootstrapToken, { allowRefresh: true });
            syncUserCookies(user);
            if (typeof window !== 'undefined') {
              sessionStorage.setItem(SESSION_TOKEN_KEY, bootstrapToken);
            }
            set({
              accessToken: bootstrapToken,
              user,
              isAuthenticated: true,
              isHydrating: false,
            });
            return;
          } catch {
            if (typeof window !== 'undefined') sessionStorage.removeItem(SESSION_TOKEN_KEY);
          }
        }

        // Stale/missing access token — single-flight cookie refresh (no expired-JWT 401 flash).
        try {
          const accessToken = await refreshSession();
          let user = get().user;
          try {
            user = await tryMe(accessToken);
            syncUserCookies(user);
          } catch {
            /* keep whatever user we have */
          }
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(SESSION_TOKEN_KEY, accessToken);
          }
          set({
            accessToken,
            user,
            isAuthenticated: Boolean(user?.id || accessToken),
            isHydrating: false,
          });
        } catch {
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem(SESSION_TOKEN_KEY);
          }
          set({
            user: null,
            accessToken: null,
            isAuthenticated: false,
            isHydrating: false,
          });
        }
      },
    }),
    {
      name: 'profytron-auth',
      partialize: (state) => ({
        user: state.user
          ? {
              id: state.user.id,
              googleId: state.user.googleId,
              email: state.user.email,
              fullName: state.user.fullName,
              username: state.user.username,
              avatarUrl: state.user.avatarUrl,
              role: state.user.role,
              onboardingCompleted: state.user.onboardingCompleted,
            }
          : null,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.isAuthenticated = false;
        state.accessToken = null;
        state.isHydrating = true;
      },
    },
  ),
);
