"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

/**
 * After the dashboard hydrates, quietly warm every other top-level route's
 * RSC payload during browser idle time. The user clicks a tab → Next.js
 * already has the server component tree cached → navigation is "instant"
 * (the visible work is just paint of cached HTML).
 *
 * Next.js's `<Link prefetch>` already does this when a link is in the
 * viewport — this component plugs the gap for routes hidden behind drawers,
 * select menus, or below-the-fold links, and pre-warms them BEFORE the user
 * has even hovered a sidenav item.
 *
 * Cost: each prefetch is a single RSC payload fetch (~10-30 KB), gated
 * behind `requestIdleCallback` with a 2.5s timeout so it never competes
 * with first paint, hydration, or the user's first interaction.
 */
const PREFETCH_ROUTES = [
  "/",
  "/map",
  "/fleet",
  "/stations",
  "/launches",
  "/feasibility",
  "/vendors",
  "/about",
] as const;

export function RoutePrefetcher() {
  const router = useRouter();

  React.useEffect(() => {
    /* One-shot — never thrash on rerender. Track scheduled state on a ref
       to survive React.StrictMode double-invoke in dev. */
    let cancelled = false;

    const warm = () => {
      if (cancelled) return;
      for (const path of PREFETCH_ROUTES) {
        router.prefetch(path);
      }
    };

    const w = window as typeof window & {
      requestIdleCallback?: (
        cb: () => void,
        opts?: { timeout: number }
      ) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    let idleId: number | undefined;
    let timerId: number | undefined;

    if (typeof w.requestIdleCallback === "function") {
      idleId = w.requestIdleCallback(warm, { timeout: 2500 });
    } else {
      timerId = window.setTimeout(warm, 1500);
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined && typeof w.cancelIdleCallback === "function") {
        w.cancelIdleCallback(idleId);
      }
      if (timerId !== undefined) window.clearTimeout(timerId);
    };
  }, [router]);

  return null;
}
