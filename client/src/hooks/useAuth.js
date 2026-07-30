import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * Custom hook to access authentication state and methods.
 *
 * Usage:
 *   const { user, isAuthenticated, login, logout } = useAuth();
 *
 * Throws an error if used outside of AuthProvider.
 */
const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default useAuth;
