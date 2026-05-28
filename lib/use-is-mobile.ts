"use client";

import * as React from "react";

/**
 * Boolean media-query hook. Returns `true` while the viewport is below
 * `breakpointPx` (default 768px, matching Tailwind's `md`). Used to flip
 * mobile-only behaviour in client components — e.g. collapsing both map
 * side panels by default on phones, or swapping a wide toolbar for a
 * single overflow-scrollable strip.
 *
 * SSR-safe: returns `false` on the first server render so markup matches
 * the desktop layout; the `useEffect` then re-syncs to the real viewport
 * on the client. That avoids hydration mismatches at the cost of a single
 * post-mount re-render on phones.
 */
export function useIsMobile(breakpointPx = 768): boolean {
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpointPx - 1}px)`);
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, [breakpointPx]);

  return isMobile;
}
