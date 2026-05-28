"use client";

import * as React from "react";
import { ChevronDown, Navigation, PlaneLanding } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { haversineNm, msToKt } from "@/lib/geo";
import type { AircraftState } from "@/lib/data/opensky";
import type { StationKpiBundle } from "@/lib/types";

function bearingDeg(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number }
) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (r: number) => (r * 180) / Math.PI;
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const dLon = toRad(to.lon - from.lon);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function angularDiff(a: number, b: number) {
  return Math.abs(((a - b + 540) % 360) - 180);
}

function inferDestination(
  aircraft: AircraftState,
  snapshot: StationKpiBundle[]
) {
  if (
    aircraft.status !== "flying" ||
    aircraft.lat === null ||
    aircraft.lon === null ||
    aircraft.trackDeg === null
  ) {
    return null;
  }
  const speedKt =
    aircraft.velocityMs !== null ? Math.max(1, msToKt(aircraft.velocityMs)) : 420;
  const current = { lat: aircraft.lat, lon: aircraft.lon };

  const candidates = snapshot
    .map((bundle) => {
      const distanceNm = haversineNm(current, {
        lat: bundle.station.lat,
        lon: bundle.station.lon,
      });
      const bearing = bearingDeg(current, {
        lat: bundle.station.lat,
        lon: bundle.station.lon,
      });
      const headingDelta = angularDiff(aircraft.trackDeg ?? 0, bearing);
      // Prefer stations roughly ahead, then closest ones.
      const score = headingDelta * 7 + distanceNm;
      return { bundle, distanceNm, headingDelta, score };
    })
    .filter((c) => c.headingDelta < 95)
    .sort((a, b) => a.score - b.score);

  const best = candidates[0];
  if (!best) return null;
  const etaMinutes = Math.round((best.distanceNm / speedKt) * 60);
  return {
    station: best.bundle.station,
    status: best.bundle.current.status,
    distanceNm: best.distanceNm,
    headingDelta: best.headingDelta,
    etaMinutes,
  };
}

export function ActiveDestinationsPanel({
  aircraft,
  snapshot,
  defaultOpen = true,
}: {
  aircraft: AircraftState[];
  snapshot: StationKpiBundle[];
  /** See `FleetPanel.defaultOpen` — same pattern: closed by default on mobile. */
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  /* Render-phase resync — same pattern as FleetPanel. Keeps the panel in
     step with the mobile/desktop default when the viewport breakpoint
     flips, without tripping the `set-state-in-effect` rule. */
  const [prevDefault, setPrevDefault] = React.useState(defaultOpen);
  if (prevDefault !== defaultOpen) {
    setPrevDefault(defaultOpen);
    setOpen(defaultOpen);
  }

  const rows = aircraft
    .map((a) => ({ aircraft: a, inferred: inferDestination(a, snapshot) }))
    .filter((row) => row.inferred !== null);

  /* Collapsed pill — pinned bottom-LEFT to mirror the Fleet pill on the
     opposite side. Both can coexist on a phone without overlapping. */
  if (!open) {
    return (
      <div className="absolute bottom-3 left-3 md:left-6 pointer-events-auto">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setOpen(true)}
          className="bg-white/95 shadow-md"
        >
          <PlaneLanding className="h-3.5 w-3.5" />
          Active ({rows.length})
        </Button>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="absolute bottom-3 md:bottom-6 left-3 md:left-6 w-[calc(100vw-1.5rem)] sm:w-[330px] max-w-[330px] bg-white/98 border border-jx-border rounded-lg shadow-xl p-4 pointer-events-auto">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-jx-text">
            <PlaneLanding className="h-4 w-4 text-jx-orange" />
            Active destinations
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setOpen(false)}
            className="h-7 w-7"
            aria-label="Collapse active destinations"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </div>
        <p className="mt-2 text-xs text-jx-muted leading-relaxed">
          No tracked aircraft are currently flying toward a Jetex station.
        </p>
      </div>
    );
  }

  return (
    <div className="absolute bottom-3 md:bottom-6 left-3 md:left-6 w-[calc(100vw-1.5rem)] sm:w-[360px] max-w-[360px] bg-white/98 border border-jx-border rounded-lg shadow-xl pointer-events-auto overflow-hidden">
      <div className="px-4 py-3 border-b border-jx-border bg-jx-panel flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-jx-text">
            <PlaneLanding className="h-4 w-4 text-jx-orange" />
            Active destinations ({rows.length})
          </div>
          <div className="text-[10px] text-jx-muted font-mono mt-0.5">
            inferred from live heading + Jetex network geometry
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setOpen(false)}
          className="h-7 w-7 shrink-0"
          aria-label="Collapse active destinations"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </div>
      <div className="divide-y divide-jx-border/60 max-h-[40vh] overflow-y-auto">
        {rows.map(({ aircraft, inferred }) => (
          <div key={aircraft.icao24} className="px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-sm text-jx-text font-semibold">
                    {aircraft.tail}
                  </span>
                  {aircraft.layer === "simulated" ? (
                    <span
                      className="px-1 py-0 rounded text-[8px] font-bold tracking-[0.15em] uppercase text-white"
                      style={{ background: "#1f6aa6" }}
                    >
                      SIM
                    </span>
                  ) : null}
                </div>
                <div className="text-[11px] text-jx-muted">
                  {aircraft.model}
                </div>
              </div>
              <Badge
                variant={
                  inferred!.status === "critical"
                    ? "critical"
                    : inferred!.status === "watch"
                      ? "watch"
                      : "healthy"
                }
              >
                {inferred!.station.icao}
              </Badge>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-[11px]">
              <KV label="To" value={inferred!.station.city} />
              <KV label="ETA" value={`${inferred!.etaMinutes}m`} />
              <KV label="Dist" value={`${inferred!.distanceNm.toFixed(0)} nm`} />
            </div>
            <div className="mt-2 flex items-center gap-1 text-[10px] text-jx-muted">
              <Navigation className="h-3 w-3 text-jx-orange" />
              heading offset {inferred!.headingDelta.toFixed(0)}°
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-jx-subtle">{label}</div>
      <div className="font-mono text-jx-text truncate">{value}</div>
    </div>
  );
}
