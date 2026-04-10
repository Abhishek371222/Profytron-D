import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
 id: string;
 name: string;
 email: string;
 tier: string;
 balance: number;
 avatar?: string;
 role?: 'USER' | 'ADMIN';
}

interface AuthState {
 user: User | null;
 isAuthenticated: boolean;
 isLoading: boolean;
 setAuth: (user: User) => void;
 login: (email: string, password: string) => Promise<void>;
 logout: () => void;
}

export const useAuthStore = create<AuthState>()(
 persist(
 (set) => ({
 user: null,
 isAuthenticated: false,
 isLoading: false,
 setAuth: (user) => set({ user, isAuthenticated: true }),
 login: async (email, _password) => {
 set({ isLoading: true });
 // Simulate API call
 await new Promise((resolve) => setTimeout(resolve, 1500));
 
 const isAdmin = email === 'admin@profytron.com';
 
 const mockUser: User = {
 id: isAdmin ? 'admin-1' : 'u1',
 name: isAdmin ? 'System Administrator' : 'Alpha Trader',
 email,
 tier: 'Institutional',
 balance: 1250000,
 avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
 role: isAdmin ? 'ADMIN' : 'USER',
 };
 set({ user: mockUser, isAuthenticated: true, isLoading: false });
 },
 logout: () => set({ user: null, isAuthenticated: false }),
 }),
 { name: 'profytron-auth' }
 )
);
