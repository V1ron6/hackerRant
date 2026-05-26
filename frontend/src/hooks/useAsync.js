/**
 * useAsync
 */

import { useCallback, useState } from 'react';

const useAsync = (asyncFn) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const run = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        return await asyncFn(...args);
      } catch (e) {
        setError(e);
        throw e;
      } finally {
        setLoading(false);
      }
    },
    [asyncFn]
  );

  return { run, loading, error };
};

export default useAsync;
