import { create } from 'zustand';

interface UIState {
 sidebarOpen: boolean;
 activeTab: string;
 commandPaletteOpen: boolean;
 depositIntent: boolean;
 aiChatOpen: boolean;
 toggleSidebar: () => void;
 setSidebarOpen: (open: boolean) => void;
 setActiveTab: (tab: string) => void;
 setCommandPaletteOpen: (open: boolean) => void;
 setDepositIntent: (open: boolean) => void;
 setAIChatOpen: (open: boolean) => void;
 toggleAIChat: () => void;
}

export const useUIStore = create<UIState>((set) => ({
 sidebarOpen: true,
 activeTab: 'dashboard',
 commandPaletteOpen: false,
 depositIntent: false,
 aiChatOpen: false,
 toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
 setSidebarOpen: (open) => set({ sidebarOpen: open }),
 setActiveTab: (tab) => set({ activeTab: tab }),
 setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
 setDepositIntent: (open) => set({ depositIntent: open }),
 setAIChatOpen: (open) => set({ aiChatOpen: open }),
 toggleAIChat: () => set((state) => ({ aiChatOpen: !state.aiChatOpen })),
}));
