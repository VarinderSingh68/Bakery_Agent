import React from 'react';
import { useReveal } from '../hooks/useReveal';

/**
 * Reveal — the site-wide scroll animation primitive.
 *
 * Mirrors the reference site's language: content sits a few pixels off
 * its resting position with 0 opacity, then eases into place the moment
 * it scrolls into view, using a slightly slow, deliberate cubic-bezier
 * rather than a bouncy one. Wrap any section, card, or block with it.
 *
 * Props:
 *  - variant: 'up' | 'down' | 'left' | 'right' | 'scale' | 'fade'
 *  - delay: seconds, applied via transition-delay
 *  - duration: seconds
 *  - as: element/component to render (default 'div')
 *  - trigger: 'scroll' (default, IntersectionObserver) | 'mount' (fires immediately, for above-the-fold hero content)
 */
export const Reveal = ({
  children,
  variant = 'up',
  delay = 0,
  duration = 0.8,
  className = '',
  as: Component = 'div',
  trigger = 'scroll',
  threshold,
  ...rest
}) => {
  const [ref, isVisible] = useReveal(threshold ? { threshold } : undefined);
  const visible = trigger === 'mount' ? true : isVisible;

  return (
    <Component
      ref={ref}
      className={`reveal reveal-${variant} ${visible ? 'is-visible' : ''} ${className}`.trim()}
      style={{
        transitionDuration: `${duration}s`,
        transitionDelay: visible ? `${delay}s` : '0s',
      }}
      {...rest}
    >
      {children}
    </Component>
  );
};

export default Reveal;
