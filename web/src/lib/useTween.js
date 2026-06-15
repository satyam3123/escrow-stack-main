import { useEffect, useRef, useState } from 'react';

/**
 * Eases a displayed number toward a target whenever the target changes — so
 * prices glide between values instead of snapping. easeOutCubic over ~480ms.
 */
export function useTween(target, duration = 480) {
  const [value, setValue] = useState(target);
  const raf = useRef(0);
  const valueRef = useRef(target);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    const from = valueRef.current;
    const delta = target - from;
    if (Math.abs(delta) < 1e-9) {
      setValue(target);
      return;
    }
    const start = performance.now();
    const step = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(from + delta * eased);
      if (t < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, duration]);

  return value;
}
