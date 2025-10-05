import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const storedUserId = localStorage.getItem('currentUserId');
      if (storedUserId) {
        setUser({ id: storedUserId });
      }
      setLoading(false);
    };

    getUser();
  }, []);

  const signIn = async (userId) => {
    localStorage.setItem('currentUserId', userId);
    setUser({ id: userId });
  };

  const signOut = async () => {
    localStorage.removeItem('currentUserId');
    setUser(null);
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
