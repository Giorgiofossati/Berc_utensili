import { create } from 'zustand';

export const useNavigationStore = create((set) => ({
  currentView: 'home',
  setCurrentView: (view) => set({ currentView: view }),
  resetNavigation: () => set({ currentView: 'home' })
}));
