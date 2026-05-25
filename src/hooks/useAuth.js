import { useState } from 'react';

export function useAuth() {
  const [currentUser, setCurrentUser] = useState(null);

  const login = (user) => setCurrentUser(user);
  const logout = () => setCurrentUser(null);

  return { currentUser, login, logout, setCurrentUser };
}
