import React from 'react';

/**
 * Marquee — infinite horizontal auto-scroll strip, in the spirit of the
 * reference site's continuously-scrolling trust/partner strip. Duplicates
 * its children so the loop is seamless, and pauses on hover/focus.
 */
export const Marquee = ({ children, speed = 28, className = '', reverse = false }) => {
  return (
    <div className={`marquee-viewport ${className}`.trim()}>
      <div
        className={`marquee-track ${reverse ? 'marquee-reverse' : ''}`.trim()}
        style={{ animationDuration: `${speed}s` }}
      >
        <div className="marquee-group">{children}</div>
        <div className="marquee-group" aria-hidden="true">{children}</div>
      </div>
    </div>
  );
};

export default Marquee;
