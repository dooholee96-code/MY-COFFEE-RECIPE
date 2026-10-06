import { useCallback, useState } from 'react';
import { readJSON, writeJSON } from '../lib/storage';

/**
 * useState 와 같지만 값이 localStorage 에 남는다.
 * `sanitize` 를 주면 읽은 값을 한 번 거른다 — 모양이 깨진 저장 데이터가 렌더를 깨뜨리지 않게.
 */
export function usePersistentState<T>(key: string, initial: T, sanitize?: (raw: unknown) => T) {
  const [value, setValue] = useState<T>(() => {
    const raw = readJSON<unknown>(key, initial);
    return sanitize ? sanitize(raw) : (raw as T);
  });

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
