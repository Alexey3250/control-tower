import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Tiny shimmer primitive used by every loading.tsx + Suspense fallback.
 * The shimmer hints "data is on its way", contrasted with the static
 * frame of the page shell which is already rendered.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-jx-border/55",
        className
      )}
      {...props}
    />
  );
}

/** A pulsing "live data inbound" badge, sized to match a real Badge. */
export function LiveDataPulse({ label = "Loading live data" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-jx-muted font-semibold">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-jx-orange opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-jx-orange" />
      </span>
      {label}
    </span>
  );
}
