/**
 * Form validation utilities.
 * Reusable validation functions for consistent error messages.
 */

export const validateEmail = (email) => {
  if (!email) return 'Email is required';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email)) return 'Please enter a valid email address';
  return '';
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter';
  if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter';
  if (!/[0-9]/.test(password)) return 'Password must contain a number';
  return '';
};

export const validateRequired = (value, fieldName) => {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return fieldName + ' is required';
  }
  return '';
};

export const validateMinLength = (value, min, fieldName) => {
  if (!value || value.trim().length < min) {
    return fieldName + ' must be at least ' + min + ' characters';
  }
  return '';
};

export const validateUrl = (url) => {
  if (!url) return '';
  try {
    new URL(url);
    return '';
  } catch {
    return 'Please enter a valid URL';
  }
};
