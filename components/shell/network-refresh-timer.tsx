"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Radio } from "lucide-react";

async function pingNetwork() {
  // Lightweight server poke; the route handler revalidates cache tags.
  const res = await fetch("/api/heartbeat", { cache: "no-store" });
  if (!res.ok) throw new Error("heartbeat failed");
  return res.json() as Promise<{ now: string }>;
}

export function NetworkRefreshTimer({ intervalSec = 30 }: { intervalSec?: number }) {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ["heartbeat"],
    queryFn: pingNetwork,
    refetchInterval: intervalSec * 1000,
    refetchOnWindowFocus: false,
  });

  // When heartbeat resolves, invalidate other live queries so they refetch.
  React.useEffect(() => {
    if (!data) return;
    queryClient.invalidateQueries({ queryKey: ["live-aircraft"] });
  }, [data, queryClient]);

  const stamp = data?.now ? new Date(data.now) : new Date();

  return (
    <div className="flex items-center gap-2 text-xs text-jx-muted font-mono">
      <Radio className="h-3 w-3 text-jx-healthy animate-pulse" />
      {stamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
      <span className="text-jx-subtle">· {intervalSec}s refresh</span>
    </div>
  );
}
