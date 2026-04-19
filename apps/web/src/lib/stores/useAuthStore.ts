import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { authApi } from '../api/auth';
import { unwrapApiResponse } from '../api/client';

const isMockApiEnabled = process.env.NEXT_PUBLIC_ENABLE_MOCK_API === 'true';

// Inline until workspace types are resolved
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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrating: true,

      setAuth: (user, accessToken) => set({ user, accessToken, isAuthenticated: true }),
      
      setToken: (accessToken) => set({ accessToken }),

      clearAuth: () =>
        {
        if (typeof window !== 'undefined') {
          document.cookie = 'demo_access=; path=/; max-age=0; samesite=lax';
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
        if (typeof window !== 'undefined' && accessToken.startsWith('mock_token_')) {
          document.cookie = 'demo_access=1; path=/; max-age=86400; samesite=lax';
        }
        set({ user, accessToken, isAuthenticated: true, isLoading: false, isHydrating: false });
      },

      logout: async () => {
        set({ isLoading: true });
        try {
           await authApi.logout();
        } catch (e) {
           console.error("Logout API failed, continuing client purge.");
        }
        get().clearAuth();
      },

      hydrate: async () => {
        if (isMockApiEnabled) {
          set((state) => ({
            isAuthenticated: Boolean(state.user),
            isHydrating: false,
          }));
          return;
        }

        try {
          // This call triggers the HTTP-only cookie automatically if credentials inclusion is true
          const response = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL || '/api'}/auth/refresh`,
            {},
            { withCredentials: true }
          );
          const data = unwrapApiResponse<{ accessToken: string }>(response.data);
          set({ accessToken: data.accessToken, isAuthenticated: true, isHydrating: false });
        } catch (error) {
          // Boot failed silently if no session
          set({ user: null, accessToken: null, isAuthenticated: false, isHydrating: false });
        }
      },
    }),
    { 
        name: 'profytron-auth',
        // Persist a minimal user snapshot only; never persist access tokens.
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
              }
            : null,
        })
    }
  )
);
