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
import {
  ensureWorkspaceCacheOwner,
  purgeWorkspaceCaches,
} from '../queries/purge-workspace-caches';

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
  /** True once auth is confirmed AND has held for SESSION_SETTLE_MS.
   * A freshly-issued token can be momentarily rejected by other endpoints
   * while the backend's session/cache state finishes propagating — gating
   * dashboard queries on this instead of isAuthenticated directly avoids
   * that first-request-401-then-silent-retry flash across every widget. */
  sessionReady: boolean;
  setAuth: (user: User, accessToken: string) => void;
  setToken: (token: string) => void;
  updateUser: (patch: Partial<User>) => void;
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

// Client-set session hint for the edge middleware (proxy.ts) ONLY.
//
// The real refresh_token cookie is set via the login XHR *response*, and Safari
// /iOS WebKit does not reliably commit response cookies before a same-tick
// window.location navigation — so the immediate hop to /dashboard races ahead
// of the cookie and proxy.ts bounces to /login. A document.cookie write, by
// contrast, is committed synchronously on every browser, so this hint is
// guaranteed present on that first navigation.
//
// This is a UX gate only, NOT an auth boundary: every protected API call still
// requires the Bearer access token / valid refresh_token, so a forged or stale
// hint grants no data access — it just lets the client-side hydrate run and
// self-correct (bouncing to /login if there is really no session). Mirrors the
// existing demo_access cookie pattern. Non-httpOnly by necessity (JS must set
// it); lifetime matches the 7-day refresh token.
const SESSION_HINT_MAX_AGE = 7 * 24 * 60 * 60;
function setSessionHintCookie(active: boolean) {
  if (typeof window === 'undefined') return;
  document.cookie = active
    ? `pf_session_hint=1; path=/; max-age=${SESSION_HINT_MAX_AGE}; samesite=lax`
    : 'pf_session_hint=; path=/; max-age=0; samesite=lax';
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrating: true,
      sessionReady: false,
      setAuth: (user, accessToken) => {
        if (user?.id) ensureWorkspaceCacheOwner(user.id);
        set({ user, accessToken, isAuthenticated: true });
      },
      setToken: (accessToken) => set({ accessToken, isAuthenticated: true }),
      updateUser: (patch) => {
        const current = get().user;
        if (!current) return;
        const next = { ...current, ...patch };
        syncUserCookies(next);
        set({ user: next });
      },
      clearAuth: () => {
        if (typeof window !== 'undefined') {
          sessionStorage.removeItem(SESSION_TOKEN_KEY);
          document.cookie = 'demo_access=; path=/; max-age=0; samesite=lax';
          document.cookie = 'onboarding_completed=; path=/; max-age=0; samesite=lax';
          document.cookie = 'user_role=; path=/; max-age=0; samesite=lax';
          setSessionHintCookie(false);
        }
        // Drop Overview / broker snapshots so the next login never paints
        // another user's balance for 1–2s.
        purgeWorkspaceCaches();
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isLoading: false,
          isHydrating: false,
          sessionReady: false,
        });
      },
      login: (accessToken, user) => {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem(SESSION_TOKEN_KEY, accessToken);
          sessionStorage.removeItem(FORCE_LOGIN_KEY);
          if (accessToken.startsWith('mock_token_')) {
            document.cookie = 'demo_access=1; path=/; max-age=86400; samesite=lax';
          }
          // Set synchronously BEFORE any window.location navigation so the edge
          // middleware sees a session on the first hop even on Safari, where the
          // refresh_token response cookie may not be committed yet (see helper).
          setSessionHintCookie(true);
          syncUserCookies(user);
          if (user?.id && window.posthog) {
            window.posthog.identify(user.id, { email: user.email, name: user.fullName });
          }
        }
        // Bind (or wipe) workspace caches to this user before any hydrate.
        if (user?.id) ensureWorkspaceCacheOwner(user.id);
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
            setSessionHintCookie(false);
            purgeWorkspaceCaches();
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
            setSessionHintCookie(true);
            set({
              accessToken: bootstrapToken,
              user,
              isAuthenticated: true,
              isHydrating: false,
            });
            if (user?.id) ensureWorkspaceCacheOwner(user.id);
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
          } catch (meError) {
            // A freshly-refreshed token that /users/me itself rejects (401/403)
            // is not authenticated, whatever the API said a moment ago — treat
            // it as a failed hydrate so we don't mark isAuthenticated true and
            // let every session-gated query on the page fire against a token
            // the API is going to reject anyway.
            const status = (meError as { response?: { status?: number } })?.response?.status;
            if (status === 401 || status === 403) {
              throw meError;
            }
            /* transient /me failure (network/5xx) — keep whatever user we have */
          }
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(SESSION_TOKEN_KEY, accessToken);
          }
          setSessionHintCookie(true);
          set({
            accessToken,
            user,
            isAuthenticated: Boolean(user?.id || accessToken),
            isHydrating: false,
          });
          if (user?.id) ensureWorkspaceCacheOwner(user.id);
        } catch {
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem(SESSION_TOKEN_KEY);
          }
          // Terminal "not authenticated" — drop the hint so a stale value can't
          // keep letting the edge middleware wave this browser into protected
          // routes on the next navigation.
          setSessionHintCookie(false);
          purgeWorkspaceCaches();
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
              twoFactorEnabled: state.user.twoFactorEnabled,
              hasPassword: state.user.hasPassword,
            }
          : null,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        state.isAuthenticated = false;
        state.accessToken = null;
        state.isHydrating = true;
        state.sessionReady = false;
      },
    },
  ),
);

// A freshly-confirmed token can still be momentarily rejected by other
// endpoints while the backend's session/cache state finishes propagating.
// Derive `sessionReady` centrally (rather than in every consumer) so it only
// flips true SESSION_SETTLE_MS after auth is confirmed, and flips false
// immediately the moment auth drops — every dashboard query should gate on
// this instead of computing its own isAuthenticated && !isHydrating check.
const SESSION_SETTLE_MS = 400;
let sessionSettleTimer: ReturnType<typeof setTimeout> | null = null;

useAuthStore.subscribe((state, prevState) => {
  const isReady = state.isAuthenticated && !state.isHydrating && Boolean(state.accessToken);
  const wasReady =
    prevState.isAuthenticated && !prevState.isHydrating && Boolean(prevState.accessToken);
  if (isReady === wasReady) return;

  if (sessionSettleTimer) {
    clearTimeout(sessionSettleTimer);
    sessionSettleTimer = null;
  }

  if (isReady) {
    sessionSettleTimer = setTimeout(() => {
      sessionSettleTimer = null;
      useAuthStore.setState({ sessionReady: true });
    }, SESSION_SETTLE_MS);
  } else if (state.sessionReady) {
    useAuthStore.setState({ sessionReady: false });
  }
});
