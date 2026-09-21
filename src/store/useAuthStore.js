import { create } from 'zustand';
import { useNavigationStore } from './useNavigationStore';
import { useFilterStore } from './useFilterStore';
import { useTutorialStore } from './useTutorialStore';

const sanitizeUser = (user) => {
  if (!user) return null;
  // eslint-disable-next-line no-unused-vars
  const { password, ...safeUser } = user;
  return safeUser;
};

export const useAuthStore = create((set) => ({
  currentUser: (() => {
    try {
      const saved = localStorage.getItem('berc_user');
      if (saved) {
        const parsed = JSON.parse(saved);
        return sanitizeUser(parsed);
      }
    } catch (e) {
      console.error('Error parsing saved user', e);
    }
    return null;
  })(),
  login: (user) => set(() => {
    const safeUser = sanitizeUser(user);
    if (safeUser) {
      try {
        localStorage.setItem('berc_user', JSON.stringify(safeUser));
      } catch (e) {
        console.warn('localStorage error', e);
      }
      if (safeUser.ruolo !== 'Admin' && useNavigationStore.getState().currentView === 'operators') {
        useNavigationStore.getState().resetNavigation();
      }
      
      const savedView = localStorage.getItem(`berc_viewMode_${safeUser.id}`);
      if (savedView) {
        useFilterStore.getState().setViewMode(savedView);
      } else if (safeUser.ruolo === 'Admin') {
        useFilterStore.getState().setViewMode('dropdown');
      } else {
        useFilterStore.getState().setViewMode('grid');
      }
    }
    return { currentUser: safeUser };
  }),
  logout: () => set(() => {
    try {
      localStorage.removeItem('berc_user');
    } catch { /* ignore */ }
    try {
      useTutorialStore.getState().closeTutorial();
    } catch { /* ignore */ }
    useNavigationStore.getState().resetNavigation();
    useFilterStore.getState().resetFilters();
    return { currentUser: null };
  }),
  setCurrentUser: (user) => set(() => {
    const safeUser = sanitizeUser(user);
    if (safeUser) {
      try {
        localStorage.setItem('berc_user', JSON.stringify(safeUser));
      } catch (e) {
        console.warn('localStorage error', e);
      }
      if (safeUser.ruolo !== 'Admin' && useNavigationStore.getState().currentView === 'operators') {
        useNavigationStore.getState().resetNavigation();
      }
      const savedView = localStorage.getItem(`berc_viewMode_${safeUser.id}`);
      if (savedView) {
        useFilterStore.getState().setViewMode(savedView);
      } else if (safeUser.ruolo === 'Admin') {
        useFilterStore.getState().setViewMode('dropdown');
      } else {
        useFilterStore.getState().setViewMode('grid');
      }
    } else {
      try {
        localStorage.removeItem('berc_user');
      } catch { /* ignore */ }
      try {
        useTutorialStore.getState().closeTutorial();
      } catch { /* ignore */ }
      useNavigationStore.getState().resetNavigation();
      useFilterStore.getState().resetFilters();
    }
    return { currentUser: safeUser };
  }),
  completeTutorial: () => set((state) => {
    if (!state.currentUser) return state;
    const updated = { ...state.currentUser, has_completed_tutorial: true };
    try {
      localStorage.setItem('berc_user', JSON.stringify(updated));
    } catch (e) {
      console.warn('localStorage error', e);
    }
    return { currentUser: updated };
  })
}));
