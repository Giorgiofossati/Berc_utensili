import { create } from 'zustand';
import { useFilterStore } from './useFilterStore';

export const useNavigationStore = create((set) => ({
  currentView: 'home',
  // Drawer sidebar su mobile: aperto dal bottone menu dell'AppBar (presente in ogni vista)
  isMobileSidebarOpen: false,
  setMobileSidebarOpen: (open) => set((state) => (state.isMobileSidebarOpen === open ? state : { isMobileSidebarOpen: open })),
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
