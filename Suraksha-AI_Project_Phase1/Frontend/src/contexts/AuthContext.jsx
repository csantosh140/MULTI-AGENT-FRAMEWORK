import React, { createContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize Auth state from LocalStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('suraksha_token');
      const storedUser = localStorage.getItem('suraksha_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        
        try {
          // Verify with backend that the token is still valid
          const response = await authService.getProfile();
          if (response.success && response.data) {
            setUser(response.data);
            localStorage.setItem('suraksha_user', JSON.stringify(response.data));
          }
        } catch (e) {
          // Token expired or invalid, clear everything
          localStorage.removeItem('suraksha_token');
          localStorage.removeItem('suraksha_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const response = await authService.login(email, password);
      if (response.success && response.data) {
        const { token: jwtToken, user: userProfile } = response.data;
        
        setToken(jwtToken);
        setUser(userProfile);
        
        localStorage.setItem('suraksha_token', jwtToken);
        localStorage.setItem('suraksha_user', JSON.stringify(userProfile));
        
        return { success: true, message: response.message };
      }
      return { success: false, message: response.message || "Failed to authenticate." };
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Internal connection error. Backend might be offline.";
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (name, email, password) => {
    setLoading(true);
    try {
      const response = await authService.register(name, email, password);
      if (response.success && response.data) {
        const { token: jwtToken, user: userProfile } = response.data;

        setToken(jwtToken);
        setUser(userProfile);

        localStorage.setItem('suraksha_token', jwtToken);
        localStorage.setItem('suraksha_user', JSON.stringify(userProfile));

        return { success: true, message: response.message };
      }
      return { success: false, message: response.message || "Failed to create account." };
    } catch (error) {
      const errorMsg = error.response?.data?.message || "Internal connection error. Backend might be offline.";
      return { success: false, message: errorMsg };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await authService.logout();
    } catch (e) {
      // Ignore API logout error as we clear local state anyway
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('suraksha_token');
      localStorage.removeItem('suraksha_user');
      setLoading(false);
    }
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token,
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
