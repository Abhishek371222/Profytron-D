import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import axios from 'axios';
import { authApi } from '../api/auth';

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

      login: (accessToken, user) => {
        set({ user, accessToken, isAuthenticated: true, isLoading: false, isHydrating: false });
      },

      logout: async () => {
        set({ isLoading: true });
        try {
           await authApi.logout();
        } catch (e) {
           console.error("Logout API failed, continuing client purge.");
        }
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false });
      },

      hydrate: async () => {
        try {
          // This call triggers the HTTP-only cookie automatically if credentials inclusion is true
          const { data } = await axios.post(
            `${process.env.NEXT_PUBLIC_API_URL || '/api'}/auth/refresh`,
            {},
            { withCredentials: true }
          );
          set({ accessToken: data.accessToken, isAuthenticated: true, isHydrating: false });
        } catch (error) {
          // Boot failed silently if no session
          set({ user: null, accessToken: null, isAuthenticated: false, isHydrating: false });
        }
      },
    }),
    { 
        name: 'profytron-auth',
        partialize: (state) => ({ user: state.user }) // Prevent saving raw access token to local storage 
    }
  )
);
