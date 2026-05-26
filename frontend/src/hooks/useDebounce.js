/**
 * useDebounce
 */

import { useEffect, useState } from 'react';

const useDebounce = (value, delayMs = 300) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);

  return debounced;
};

export default useDebounce;
