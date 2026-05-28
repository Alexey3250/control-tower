import { Skeleton, LiveDataPulse } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Reusable page-shaped skeletons. They render the *layout* of the
 * eventual content so the navigation feels instant — the chrome is
 * there before any data is. Each one is intentionally cheap (CSS only,
 * no JS state, no media queries) so it ships in the loading.tsx RSC
 * payload at near-zero cost.
 */

/** Imitates `<Topbar />` while data resolves. Sticky, same height. */
export function TopbarSkeleton({ title }: { title?: string }) {
  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-jx-border bg-white/95 backdrop-blur px-3 pl-14 md:px-6 md:pl-6">
      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          {title ? (
            <h1 className="text-base md:text-xl text-jx-text font-semibold truncate">
              {title}
            </h1>
          ) : (
            <Skeleton className="h-6 w-48" />
          )}
          <LiveDataPulse />
        </div>
        <Skeleton className="h-3 w-72 max-w-[60vw]" />
      </div>
      <div className="hidden md:flex items-center gap-3">
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-9 w-[180px] rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>
    </header>
  );
}

/** A row of KPI cards, sized 2/3/6 across breakpoints — matches `<KpiCard>`. */
export function KpiStripSkeleton({ count = 6 }: { count?: number }) {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardContent className="p-4 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-2.5 w-32" />
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

/** Imitates the network-overview hero (left text rail + right network mix). */
export function HeroSkeleton() {
  return (
    <section className="rounded-lg border border-jx-border bg-white shadow-sm overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        <div className="flex-1 p-5 md:p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-44" />
            <LiveDataPulse label="Streaming" />
          </div>
          <Skeleton className="h-7 w-3/4 max-w-xl" />
          <Skeleton className="h-3 w-full max-w-3xl" />
          <Skeleton className="h-3 w-5/6 max-w-3xl" />
          <Skeleton className="h-3 w-4/6 max-w-3xl" />
          <div className="flex items-center gap-2 pt-1">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-8 w-44" />
          </div>
        </div>
        <div className="lg:w-[260px] shrink-0 border-t lg:border-t-0 lg:border-l border-jx-border bg-jx-panel/40 p-5 md:p-6 flex lg:flex-col items-center lg:items-stretch justify-between gap-4">
          <Skeleton className="h-3 w-24" />
          <div className="flex lg:flex-col gap-3 flex-1 lg:flex-initial">
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
            <Skeleton className="h-6 w-full" />
          </div>
        </div>
      </div>
    </section>
  );
}

/** A table-shaped skeleton (one header bar + N rows). */
export function TableSkeleton({
  rows = 8,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <Card>
      <CardContent className="p-4 md:p-5 space-y-3">
        <div
          className="grid gap-3 pb-2 border-b border-jx-border"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-3" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="grid gap-3 py-1.5"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
          >
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                className={
                  c === 0 ? "h-4 w-3/4" : c === cols - 1 ? "h-4 w-12" : "h-4"
                }
              />
            ))}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/** A grid of N square-ish cards (used by action cards, vendor scorecards). */
export function CardGridSkeleton({
  count = 6,
  cols = 3,
}: {
  count?: number;
  cols?: number;
}) {
  return (
    <section
      className="grid gap-3 md:gap-4"
      style={{ gridTemplateColumns: `repeat(${cols}, minmax(0,1fr))` }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-5/6" />
            <div className="flex items-center gap-2 pt-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}

/** Two-column band: left list of stations + right region rollup. */
export function TwoColumnBandSkeleton() {
  return (
    <section className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4 md:gap-5">
      <Card>
        <CardContent className="p-0">
          <div className="px-4 md:px-5 py-4 border-b border-jx-border">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32 mt-1.5" />
          </div>
          <ul>
            {Array.from({ length: 6 }).map((_, i) => (
              <li
                key={i}
                className="px-4 md:px-5 py-3 border-b border-jx-border last:border-b-0 flex items-start gap-3"
              >
                <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-56" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
                <Skeleton className="h-8 w-12 shrink-0" />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <div className="px-4 md:px-5 py-4 border-b border-jx-border">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24 mt-1.5" />
          </div>
          <ul>
            {Array.from({ length: 5 }).map((_, i) => (
              <li
                key={i}
                className="px-4 md:px-5 py-3 border-b border-jx-border last:border-b-0 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3.5 w-24" />
                  <Skeleton className="h-3.5 w-10" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full" />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}

/** Map module skeleton — orange-tinted globe placeholder with a fleet rail. */
export function MapSkeleton() {
  return (
    <div className="relative flex-1 min-h-[60vh] bg-jx-panel/40 overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 opacity-60"
        style={{
          backgroundImage:
            "radial-gradient(circle at 30% 40%, rgba(243,112,33,0.10), transparent 55%), radial-gradient(circle at 70% 60%, rgba(243,112,33,0.08), transparent 55%)",
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white/95 backdrop-blur border border-jx-border rounded-lg shadow-xl px-5 py-4 flex items-center gap-3">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-jx-orange opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-jx-orange" />
          </span>
          <div>
            <div className="text-sm font-semibold text-jx-text">
              Booting MapLibre globe…
            </div>
            <div className="text-[11px] text-jx-muted">
              CARTO Voyager tiles · Jetex destinations · OpenSky live state
            </div>
          </div>
        </div>
      </div>
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2">
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-9 w-9" />
      </div>
      <div className="hidden lg:block absolute top-16 right-3 w-[280px]">
        <Card>
          <CardContent className="p-3 space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-36" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/** Generic body skeleton — used as a safety net in stations/feasibility. */
export function PageBodySkeleton() {
  return (
    <div className="flex-1 p-4 md:p-6 space-y-5 md:space-y-6">
      <HeroSkeleton />
      <KpiStripSkeleton />
      <TwoColumnBandSkeleton />
    </div>
  );
}
