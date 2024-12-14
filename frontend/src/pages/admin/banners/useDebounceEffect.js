import { useEffect, useRef } from 'react';

export function useDebounceEffect(
  fn,
  waitTime,
  deps,
) {
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      fn();
    }, waitTime);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, deps);
} 