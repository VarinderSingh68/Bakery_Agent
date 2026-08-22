import { useEffect, useRef, useState } from 'react';

/**
 * Scroll-triggered reveal hook, modeled after the scroll-linked section
 * reveals used throughout the reference site (content stays hidden until
 * it enters the viewport, then eases in once and stays put).
 *
 * Returns a ref to attach to the element and a boolean that flips to
 * true the first time the element crosses the given threshold.
 */
export const useReveal = ({ threshold = 0.18, rootMargin = '0px 0px -8% 0px', once = true } = {}) => {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    // Respect users who've asked for reduced motion: show immediately.
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return undefined;
    }

    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setIsVisible(false);
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return [ref, isVisible];
};

export default useReveal;
