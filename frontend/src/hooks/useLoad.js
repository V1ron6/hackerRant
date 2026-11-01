/** Tiny data hook: runs `fn` on mount (and on reload) and tracks loading/error. */
import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '../services/api.js';

const useLoad = (fn, deps = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const fnRef = useRef(fn);
  fnRef.current = fn;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setData(await fnRef.current());
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, deps);

  useEffect(() => { reload(); }, [reload]);

  return { data, setData, loading, error, reload };
};

export default useLoad;
