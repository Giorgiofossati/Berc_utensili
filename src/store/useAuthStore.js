import { create } from 'zustand';
import { useNavigationStore } from './useNavigationStore';
import { useFilterStore } from './useFilterStore';

const sanitizeUser = (user) => {
  if (!user) return null;
  // eslint-disable-next-line no-unused-vars
  const { password, ...safeUser } = user;
  return safeUser;
};

export const useAuthStore = create((set) => ({
  currentUser: (() => {
    const saved = localStorage.getItem('berc_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return sanitizeUser(parsed);
      } catch (e) {
        console.error('Error parsing saved user', e);
      }
    }
    return null;
  })(),
  login: (user) => set(() => {
    const safeUser = sanitizeUser(user);
    if (safeUser) {
      localStorage.setItem('berc_user', JSON.stringify(safeUser));
      if (safeUser.ruolo !== 'Admin' && useNavigationStore.getState().currentView === 'operators') {
        useNavigationStore.getState().resetNavigation();
      }
    }
    return { currentUser: safeUser };
  }),
  logout: () => set(() => {
    localStorage.removeItem('berc_user');
    useNavigationStore.getState().resetNavigation();
    useFilterStore.getState().resetFilters();
    return { currentUser: null };
  }),
  setCurrentUser: (user) => set(() => {
    const safeUser = sanitizeUser(user);
    if (safeUser) {
      localStorage.setItem('berc_user', JSON.stringify(safeUser));
      if (safeUser.ruolo !== 'Admin' && useNavigationStore.getState().currentView === 'operators') {
        useNavigationStore.getState().resetNavigation();
      }
    } else {
      localStorage.removeItem('berc_user');
      useNavigationStore.getState().resetNavigation();
      useFilterStore.getState().resetFilters();
    }
    return { currentUser: safeUser };
  })
}));
