import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('utenti')
        .select('*')
        .order('nome', { ascending: true });
      
      if (error) {
        console.error('Error fetching users:', error);
        return [];
      }
      setUsers(data || []);
      return data;
    } catch (err) {
      console.error('Unexpected error fetching users:', err);
      return [];
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      await fetchUsers();
      
      // Load from localStorage if exists
      const savedUser = localStorage.getItem('berc_user');
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch (e) {
          console.error('Error parsing saved user', e);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, [fetchUsers]);

  const login = async (user, password = null) => {
    if (user.ruolo === 'Admin') {
      if (user.password !== password) {
        throw new Error('Password errata');
      }
    }
    
    setCurrentUser(user);
    localStorage.setItem('berc_user', JSON.stringify(user));
    return user;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('berc_user');
  };

  const value = {
    currentUser,
    users,
    loading,
    login,
    logout,
    refreshUsers: fetchUsers
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
