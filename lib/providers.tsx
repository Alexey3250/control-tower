"use client";

import * as React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { RoleProvider } from "@/lib/role-context";

/**
 * Client-side providers. We deliberately do NOT kick off any client
 * `prefetchQuery` here — that pattern blew up CPU + memory because every
 * page mount races to `/api/aircraft` even when the user has no intent
 * to view the map. Route prefetching is handled by Next.js Link +
 * `<RoutePrefetcher />` (RSC payload, cheap, idle-callback-gated), and
 * data prefetching is handled per-route via `<Suspense>` streaming.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            gcTime: 5 * 60_000,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={client}>
      <RoleProvider>
        <TooltipProvider delayDuration={120}>{children}</TooltipProvider>
      </RoleProvider>
    </QueryClientProvider>
  );
}
