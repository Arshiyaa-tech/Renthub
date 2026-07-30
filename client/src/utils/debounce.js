/**
 * Debounce utility — delays execution until after a specified wait period.
 * Useful for search inputs, resize handlers, and other high-frequency events.
 *
 * @param {Function} fn - The function to debounce
 * @param {number} delay - Delay in milliseconds (default: 300)
 * @returns {Function} Debounced function with .cancel() method
 */
export function debounce(fn, delay = 300) {
  let timer = null;
  const debounced = (...args) => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => {
      fn(...args);
      timer = null;
    }, delay);
  };
  debounced.cancel = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };
  return debounced;
}

/**
 * Throttle utility — ensures a function is called at most once per interval.
 *
 * @param {Function} fn - The function to throttle
 * @param {number} limit - Minimum interval in milliseconds (default: 300)
 * @returns {Function} Throttled function
 */
export function throttle(fn, limit = 300) {
  let inThrottle = false;
  let lastFn = null;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
        if (lastFn) {
          lastFn();
          lastFn = null;
        }
      }, limit);
    } else {
      lastFn = () => fn(...args);
    }
  };
}
