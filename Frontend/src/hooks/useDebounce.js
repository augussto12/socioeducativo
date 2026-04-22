import { useState, useEffect } from 'react';

/**
 * useDebounce — Delays updating a value until after a specified delay.
 * Useful for search inputs, filters, etc.
 *
 * @param {*} value    — the value to debounce
 * @param {number} delay — delay in milliseconds (default: 300)
 * @returns {*} — the debounced value
 */
export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
