import { createContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import * as authService from '../services/authService';

/**
 * Authentication Context — complete implementation.
 *
 * Manages user state across the app with:
 * - Automatic login persistence via localStorage
 * - Token restoration on page refresh
 * - Helper methods: login, register, logout, updateProfile
 * - Auto-logout on 401 responses
 */
export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  /**
   * Restore auth state on mount — checks localStorage for token
   * and validates it with the /api/auth/me endpoint
   */
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await authService.getCurrentUser();
        setUser(response.user || response);
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('token');
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  /**
   * Login user — calls API, stores token, sets user state
   */
  const login = useCallback(async (email, password) => {
    try {
      const response = await authService.login({ email, password });
      const { token, user: userData } = response;

      localStorage.setItem('token', token);
      setUser(userData);
      setIsAuthenticated(true);
      toast.success('Logged in successfully!');
      return { success: true, user: userData };
    } catch (error) {
      toast.error(error.message || 'Login failed');
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Register new user — calls API, stores token, sets user state
   */
  const register = useCallback(async (userData) => {
    try {
      const response = await authService.register(userData);
      const { token, user: newUser } = response;

      localStorage.setItem('token', token);
      setUser(newUser);
      setIsAuthenticated(true);
      toast.success('Account created successfully!');
      return { success: true, user: newUser };
    } catch (error) {
      toast.error(error.message || 'Registration failed');
      return { success: false, error: error.message };
    }
  }, []);

  /**
   * Logout — clears token, resets state, calls logout API
   */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (e) {
      // Even if API fails, clear local state
    }
    localStorage.removeItem('token');
    setUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out');
  }, []);

  /**
   * Update profile — calls API and updates local state
   */
  const updateProfile = useCallback(async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData);
      const updatedUser = response.user || response;
      setUser(updatedUser);
      toast.success('Profile updated!');
      return { success: true, user: updatedUser };
    } catch (error) {
      toast.error(error.message || 'Failed to update profile');
      return { success: false, error: error.message };
    }
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
