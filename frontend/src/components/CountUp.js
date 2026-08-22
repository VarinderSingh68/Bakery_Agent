import React, { useEffect, useRef, useState } from 'react';
import { useReveal } from '../hooks/useReveal';

/**
 * CountUp — animates a number from 0 up to `value` once it scrolls into
 * view, echoing the way the reference site's stat panels roll their
 * numbers in rather than just appearing.
 */
export const CountUp = ({ value, duration = 1.4, prefix = '', suffix = '', className = '' }) => {
  const [ref, isVisible] = useReveal({ threshold: 0.4 });
  const [display, setDisplay] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!isVisible || started.current) return undefined;
    started.current = true;

    const target = Number(value) || 0;
    const startTime = performance.now();

    const tick = (now) => {
      const elapsed = (now - startTime) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic — quick start, gentle settle, matching the reveal easing.
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(target * eased));
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    const frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isVisible, value, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}{display}{suffix}
    </span>
  );
};

export default CountUp;
