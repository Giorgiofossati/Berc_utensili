import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  currentUser: (() => {
    const saved = localStorage.getItem('berc_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved user', e);
      }
    }
    return null;
  })(),
  login: (user) => set(() => {
    localStorage.setItem('berc_user', JSON.stringify(user));
    return { currentUser: user };
  }),
  logout: () => set(() => {
    localStorage.removeItem('berc_user');
    return { currentUser: null };
  }),
  setCurrentUser: (user) => set(() => {
    if (user) {
      localStorage.setItem('berc_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('berc_user');
    }
    return { currentUser: user };
  })
}));
