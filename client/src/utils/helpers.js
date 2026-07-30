/**
 * Utility helper functions for the RentHub application.
 */

/**
 * Format a price as Indian Rupees (₹).
 * Can be easily changed to USD or other currencies.
 *
 * @param {number} price - The price value
 * @param {string} currency - Currency code (default: 'INR')
 * @returns {string} Formatted price string
 */
export const formatPrice = (price, currency = 'INR') => {
  const currencyMap = {
    INR: '₹',
    USD: '$',
    EUR: '€',
    GBP: '£',
  };

  const symbol = currencyMap[currency] || '₹';
  return `${symbol}${Number(price).toLocaleString('en-IN')}`;
};

/**
 * Format a date string to a human-readable format
 *
 * @param {string|Date} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options,
  };

  return new Date(date).toLocaleDateString('en-US', defaultOptions);
};

/**
 * Truncate text to a specified length with ellipsis
 *
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Generate a placeholder image URL based on category/item
 *
 * @param {string} category - Item category
 * @returns {string} Placeholder image URL
 */
export const getPlaceholderImage = (category = 'default') => {
  const images = {
    electronics: 'https://images.unsplash.com/photo-1461151304267-38535e780c79?w=400',
    tools: 'https://images.unsplash.com/photo-1504148455328-c376907d3e1c?w=400',
    photography: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400',
    sports: 'https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=400',
    camping: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400',
    gaming: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400',
    musical: 'https://images.unsplash.com/photo-1519892300165-cb5542fb47c7?w=400',
    event: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400',
    default: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400',
  };

  return images[category] || images.default;
};

/**
 * Get initials from a name (max 2 characters)
 *
 * @param {string} name - Full name
 * @returns {string} Initials
 */
export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Generate star rating display data
 *
 * @param {number} rating - Rating out of 5
 * @returns {Object} { full, half, empty } star counts
 */
export const getStarRating = (rating) => {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return { full, half, empty };
};

/**
 * Classname merging utility (simplified version)
 * Joins class names, filtering out falsy values
 */
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};
