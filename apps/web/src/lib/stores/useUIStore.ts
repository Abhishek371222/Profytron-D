import { create } from 'zustand';

interface UIState {
 sidebarOpen: boolean;
 activeTab: string;
 commandPaletteOpen: boolean;
 toggleSidebar: () => void;
 setSidebarOpen: (open: boolean) => void;
 setActiveTab: (tab: string) => void;
 setCommandPaletteOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
 sidebarOpen: true,
 activeTab: 'dashboard',
 commandPaletteOpen: false,
 toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
 setSidebarOpen: (open) => set({ sidebarOpen: open }),
 setActiveTab: (tab) => set({ activeTab: tab }),
 setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
}));
