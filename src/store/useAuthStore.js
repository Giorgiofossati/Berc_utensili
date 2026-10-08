import { create } from 'zustand';
import { useNavigationStore } from './useNavigationStore';
import { useFilterStore } from './useFilterStore';
import { useTutorialStore } from './useTutorialStore';

const sanitizeUser = (user) => {
  if (!user || typeof user !== 'object' || typeof user === 'function') return null;
  if (!user.id || !user.nome || typeof user.nome !== 'string' || !user.nome.trim()) {
    return null;
  }
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
        const validated = sanitizeUser(parsed);
        if (!validated) {
          localStorage.removeItem('berc_user');
        }
        return validated;
      }
    } catch (e) {
      console.error('Error parsing saved user', e);
      try {
        localStorage.removeItem('berc_user');
      } catch { /* ignore */ }
    }
    return null;
  })(),
  loginNotice: (() => {
    try {
      return sessionStorage.getItem('berc_login_notice') || null;
    } catch {
      return null;
    }
  })(),
  setLoginNotice: (notice) => set(() => {
    try {
      if (notice) {
        sessionStorage.setItem('berc_login_notice', notice);
      } else {
        sessionStorage.removeItem('berc_login_notice');
      }
    } catch { /* ignore */ }
    return { loginNotice: notice || null };
  }),
  clearLoginNotice: () => set(() => {
    try {
      sessionStorage.removeItem('berc_login_notice');
    } catch { /* ignore */ }
    return { loginNotice: null };
  }),
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
      } else {
        useFilterStore.getState().setViewMode('dropdown');
      }
    }
    return { currentUser: safeUser, loginNotice: null };
  }),
  logout: (notice = null) => set(() => {
    try {
      localStorage.removeItem('berc_user');
    } catch { /* ignore */ }
    try {
      useTutorialStore.getState().closeTutorial();
    } catch { /* ignore */ }
    useNavigationStore.getState().resetNavigation();
    useFilterStore.getState().resetFilters();

    if (notice) {
      try {
        sessionStorage.setItem('berc_login_notice', notice);
      } catch { /* ignore */ }
    } else {
      try {
        sessionStorage.removeItem('berc_login_notice');
      } catch { /* ignore */ }
    }

    return { currentUser: null, loginNotice: notice || null };
  }),
  setCurrentUser: (userOrUpdater) => set((state) => {
    const rawUser = typeof userOrUpdater === 'function' 
      ? userOrUpdater(state.currentUser) 
      : userOrUpdater;
    const safeUser = sanitizeUser(rawUser);
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
      } else {
        useFilterStore.getState().setViewMode('dropdown');
      }
      return { currentUser: safeUser };
    } else {
      try {
        localStorage.removeItem('berc_user');
      } catch { /* ignore */ }
      try {
        useTutorialStore.getState().closeTutorial();
      } catch { /* ignore */ }
      useNavigationStore.getState().resetNavigation();
      useFilterStore.getState().resetFilters();
      return { currentUser: null };
    }
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
