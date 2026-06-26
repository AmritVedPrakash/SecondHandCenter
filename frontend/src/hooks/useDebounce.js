// ─────────────────────────────────────────────────────────────────────────────
//  useDebounce
//  Delays updating a value until the user stops changing it for `delay` ms.
//  Used in useSearch to avoid spamming the API on every keystroke.
//
//  Usage:
//    const debouncedQuery = useDebounce(searchInput, 400)
//    // debouncedQuery only updates 400ms after user stops typing
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';

export function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup: cancel timer if value changes before delay expires
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
