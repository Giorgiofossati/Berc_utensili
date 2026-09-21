import { create } from 'zustand';
import { useFilterStore } from './useFilterStore';

export const useNavigationStore = create((set) => ({
  currentView: 'home',
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
