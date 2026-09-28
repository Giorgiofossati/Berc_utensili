import { create } from 'zustand';
import { useFilterStore } from './useFilterStore';

export const useNavigationStore = create((set) => ({
  currentView: 'home',
  // Drawer sidebar su mobile: aperto dal bottone menu dell'AppBar (presente in ogni vista)
  isMobileSidebarOpen: false,
  setMobileSidebarOpen: (open) => set((state) => (state.isMobileSidebarOpen === open ? state : { isMobileSidebarOpen: open })),
  // Sidebar fissa o auto-collassabile su desktop (default auto-collassabile: isSidebarPinned = false)
  isSidebarPinned: typeof window !== 'undefined' ? localStorage.getItem('sidebar_pinned') === 'true' : false,
  toggleSidebarPinned: () => set((state) => {
    const next = !state.isSidebarPinned;
    try { localStorage.setItem('sidebar_pinned', String(next)); } catch { /* ignore */ }
    return { isSidebarPinned: next, isSidebarCollapsed: !next };
  }),
  setSidebarPinned: (pinned) => set(() => {
    try { localStorage.setItem('sidebar_pinned', String(pinned)); } catch { /* ignore */ }
    return { isSidebarPinned: pinned, isSidebarCollapsed: !pinned };
  }),
  // Retrocompatibilità per isSidebarCollapsed
  isSidebarCollapsed: typeof window !== 'undefined' ? localStorage.getItem('sidebar_pinned') !== 'true' : true,
  toggleSidebarCollapsed: () => set((state) => {
    const nextPinned = state.isSidebarCollapsed;
    try { localStorage.setItem('sidebar_pinned', String(nextPinned)); } catch { /* ignore */ }
    return { isSidebarPinned: nextPinned, isSidebarCollapsed: !nextPinned };
  }),
  setSidebarCollapsed: (collapsed) => set(() => {
    const nextPinned = !collapsed;
    try { localStorage.setItem('sidebar_pinned', String(nextPinned)); } catch { /* ignore */ }
    return { isSidebarPinned: nextPinned, isSidebarCollapsed: collapsed };
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
