import { useState, useEffect } from 'react';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('berc_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error parsing saved user', e);
      }
    }
    return null;
  });

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('berc_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('berc_user');
    }
  }, [currentUser]);

  const login = (user) => setCurrentUser(user);
  const logout = () => setCurrentUser(null);

  return { currentUser, login, logout, setCurrentUser };
}

