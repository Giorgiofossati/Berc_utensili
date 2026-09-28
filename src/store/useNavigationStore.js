import { create } from 'zustand';
import { useFilterStore } from './useFilterStore';

export const useNavigationStore = create((set) => ({
  currentView: 'home',
  // Drawer sidebar su mobile: aperto dal bottone menu dell'AppBar (presente in ogni vista)
  isMobileSidebarOpen: false,
  setMobileSidebarOpen: (open) => set((state) => (state.isMobileSidebarOpen === open ? state : { isMobileSidebarOpen: open })),
  // Sidebar collassata su desktop (Icon only)
  isSidebarCollapsed: typeof window !== 'undefined' ? localStorage.getItem('sidebar_collapsed') === 'true' : false,
  toggleSidebarCollapsed: () => set((state) => {
    const next = !state.isSidebarCollapsed;
    try { localStorage.setItem('sidebar_collapsed', String(next)); } catch { /* ignore */ }
    return { isSidebarCollapsed: next };
  }),
  setSidebarCollapsed: (collapsed) => set(() => {
    try { localStorage.setItem('sidebar_collapsed', String(collapsed)); } catch { /* ignore */ }
    return { isSidebarCollapsed: collapsed };
  }),
  setCurrentView: (view) => {
    useFilterStore.getState().setIsSelectionMode(false);
    useFilterStore.getState().setSelectedToolsIds([]);
    set({ currentView: view });
  },
  resetNavigation: () => {
    useFilterStore.getState().setIsSelectionMode(false);
    useFilterStore.getState().setSelectedToolsIds([]);
    set({ currentView: 'home' });
  }
}));
