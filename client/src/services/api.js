import axios from 'axios';

/**
 * Axios instance pre-configured for the RentHub API.
 *
 * Features:
 * - Base URL from env or proxy
 * - Auto-attaches JWT token from localStorage
 * - Auto-logout on 401 (token expired/invalid)
 * - Normalizes error messages for consistent handling
 */

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ========== Request Interceptor ==========
// Attaches the stored JWT token to every outgoing request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ========== Response Interceptor ==========
// Handles 401 errors globally — clears token and triggers logout
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Auto-logout on 401 (token expired/invalid)
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Dispatch a custom event so AuthContext can react
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }

    // Normalize error message for consistent consumption
    const message =
      error.response?.data?.message || error.message || 'Something went wrong';

    return Promise.reject({
      status: error.response?.status,
      message,
      data: error.response?.data,
    });
  }
);

export default api;
