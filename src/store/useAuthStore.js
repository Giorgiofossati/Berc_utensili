import { create } from 'zustand';

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
    }
    return { currentUser: safeUser };
  }),
  logout: () => set(() => {
    localStorage.removeItem('berc_user');
    return { currentUser: null };
  }),
  setCurrentUser: (user) => set(() => {
    const safeUser = sanitizeUser(user);
    if (safeUser) {
      localStorage.setItem('berc_user', JSON.stringify(safeUser));
    } else {
      localStorage.removeItem('berc_user');
    }
    return { currentUser: safeUser };
  })
}));
