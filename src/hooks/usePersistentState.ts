import { useCallback, useState } from 'react';
import { readJSON, writeJSON } from '../lib/storage';

/** useState 와 같지만 값이 localStorage 에 남는다. */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readJSON(key, initial));

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        writeJSON(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  return [value, set] as const;
}
