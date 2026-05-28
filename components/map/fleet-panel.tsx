"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  Plane,
  PlaneTakeoff,
  ParkingSquare,
  ShieldQuestion,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { nearestStation, msToKt, mToFt } from "@/lib/geo";
import type { AircraftState, FleetStatus } from "@/lib/data/opensky";

interface FleetPanelProps {
  aircraft: AircraftState[];
  fetchedAt?: string;
  onFocus: (a: AircraftState) => void;
  /**
   * Whether the side panel starts expanded. We default to `true` for the
   * desktop case, but `MapView` passes `false` on phones so the map gets
   * the full viewport on first paint and the user opts in via the
   * collapsed "Fleet ({n})" pill.
   */
  defaultOpen?: boolean;
}

function statusMeta(status: FleetStatus) {
  switch (status) {
    case "flying":
      return {
        label: "Flying",
        icon: PlaneTakeoff,
        color: "text-jx-healthy",
        ring: "ring-jx-healthy/40",
        badge: "healthy" as const,
      };
    case "parked":
      return {
        label: "Parked",
        icon: ParkingSquare,
        color: "text-jx-gold",
        ring: "ring-jx-gold/40",
        badge: "gold" as const,
      };
    case "offline":
      return {
        label: "Offline",
        icon: ShieldQuestion,
        color: "text-jx-muted",
        ring: "ring-jx-border-strong",
        badge: "secondary" as const,
      };
  }
}

function timeAgo(unix: number) {
  if (!unix) return "—";
  const now = Date.now() / 1000;
  const diff = Math.max(0, now - unix);
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

export function FleetPanel({
  aircraft,
  fetchedAt,
  onFocus,
  defaultOpen = true,
}: FleetPanelProps) {
  const [open, setOpen] = React.useState(defaultOpen);
  /* When the viewport breakpoint flips (orientation / window resize),
     reset to the new default. We use the "render-phase resync" pattern
     React 19 recommends over a `useEffect(() => setX)` to avoid the
     cascading-renders lint and the extra paint. */
  const [prevDefault, setPrevDefault] = React.useState(defaultOpen);
  if (prevDefault !== defaultOpen) {
    setPrevDefault(defaultOpen);
    setOpen(defaultOpen);
  }
  const [filter, setFilter] = React.useState<FleetStatus | "all">("all");

  const counts = React.useMemo(() => {
    const c = { flying: 0, parked: 0, offline: 0 } as Record<FleetStatus, number>;
    for (const a of aircraft) c[a.status]++;
    return c;
  }, [aircraft]);

  const filtered = React.useMemo(
    () =>
      filter === "all" ? aircraft : aircraft.filter((a) => a.status === filter),
    [aircraft, filter]
  );

  const sorted = React.useMemo(
    () =>
      [...filtered].sort((a, b) => {
        const order: Record<FleetStatus, number> = {
          flying: 0,
          parked: 1,
          offline: 2,
        };
        if (a.status !== b.status) return order[a.status] - order[b.status];
        return a.tail.localeCompare(b.tail);
      }),
    [filtered]
  );

  if (!open) {
    /* Closed state: pinned bottom-right on mobile so it doesn't fight the
       top toolbar; pinned top-right on desktop so the user still sees it
       next to the layer toggles. */
    return (
      <div className="absolute md:top-20 md:right-4 right-3 bottom-3 md:bottom-auto pointer-events-auto">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setOpen(true)}
          className="bg-white/95 shadow-md"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <Plane className="h-3.5 w-3.5" />
          Fleet ({aircraft.length})
        </Button>
      </div>
    );
  }

  return (
    <div className="absolute right-3 md:right-4 top-20 bottom-3 md:bottom-6 w-[calc(100vw-1.5rem)] sm:w-[320px] md:w-[340px] max-w-[340px] flex flex-col bg-white/98 border border-jx-border rounded-lg shadow-xl pointer-events-auto overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-jx-border bg-jx-panel">
        <div>
          <div className="flex items-center gap-2">
            <Plane className="h-4 w-4 text-jx-orange" />
            <div className="text-sm font-semibold text-jx-text">
              Fleet roster ({aircraft.length})
            </div>
          </div>
          <div className="text-[10px] text-jx-muted font-mono mt-0.5">
            OpenSky · {fetchedAt ? new Date(fetchedAt).toLocaleTimeString() : "—"}
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => setOpen(false)}
          className="h-7 w-7"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-1.5 px-3 py-3 border-b border-jx-border">
        <StatBox
          label="Flying"
          value={counts.flying}
          icon={<PlaneTakeoff className="h-3 w-3" />}
          tone="healthy"
          active={filter === "flying"}
          onClick={() => setFilter(filter === "flying" ? "all" : "flying")}
        />
        <StatBox
          label="Parked"
          value={counts.parked}
          icon={<ParkingSquare className="h-3 w-3" />}
          tone="gold"
          active={filter === "parked"}
          onClick={() => setFilter(filter === "parked" ? "all" : "parked")}
        />
        <StatBox
          label="Offline"
          value={counts.offline}
          icon={<ShieldQuestion className="h-3 w-3" />}
          tone="muted"
          active={filter === "offline"}
          onClick={() => setFilter(filter === "offline" ? "all" : "offline")}
        />
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-jx-border/50">
        {sorted.map((a) => {
          const meta = statusMeta(a.status);
          const Icon = meta.icon;
          const near =
            a.lat !== null && a.lon !== null
              ? nearestStation(a.lat, a.lon, 600)
              : null;

          return (
            <div
              key={a.icao24}
              className="px-4 py-3 hover:bg-jx-panel/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Icon className={cn("h-3.5 w-3.5 shrink-0", meta.color)} />
                    {a.layer === "simulated" ? (
                      <span
                        className="font-mono text-sm text-jx-text font-semibold"
                        title="Simulated demo flight — no drilldown page"
                      >
                        {a.tail}
                      </span>
                    ) : (
                      <Link
                        href={`/fleet/${a.icao24}`}
                        className="font-mono text-sm text-jx-text font-semibold hover:text-jx-orange"
                      >
                        {a.tail}
                      </Link>
                    )}
                    <Badge variant={meta.badge} className="text-[9px] py-0">
                      {meta.label}
                    </Badge>
                    <span
                      className={cn(
                        "rounded px-1 py-0 text-[9px] uppercase tracking-wider border font-bold",
                        a.layer === "simulated"
                          ? "text-white border-transparent"
                          : a.layer === "core"
                            ? "bg-jx-orange-tint text-jx-orange-deep border-jx-orange/30"
                            : "bg-jx-panel text-jx-muted border-jx-border"
                      )}
                      style={
                        a.layer === "simulated"
                          ? { background: "#1f6aa6" }
                          : undefined
                      }
                    >
                      {a.layer === "simulated"
                        ? "SIM"
                        : a.layer === "core"
                          ? "Core"
                          : a.layer === "additional"
                            ? "Add"
                            : "DWC"}
                    </span>
                  </div>
                  <div className="text-[11px] text-jx-muted mt-0.5 truncate">
                    {a.model} · {a.typeCode}
                  </div>
                  {a.broadcastOperator ? (
                    <div className="text-[10px] text-jx-subtle truncate">
                      {a.layer === "simulated" ? "" : "FR24: "}
                      {a.broadcastOperator}
                    </div>
                  ) : null}
                </div>
                {a.lat !== null && a.lon !== null ? (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 shrink-0"
                    onClick={() => onFocus(a)}
                    title="Focus on map"
                  >
                    <Crosshair className="h-3 w-3" />
                  </Button>
                ) : null}
              </div>

              <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
                {a.status === "flying" ? (
                  <>
                    <KV
                      label="Altitude"
                      value={
                        a.baroAltitudeM !== null
                          ? `${Math.round(mToFt(a.baroAltitudeM)).toLocaleString()} ft`
                          : "—"
                      }
                    />
                    <KV
                      label="Speed"
                      value={
                        a.velocityMs !== null
                          ? `${Math.round(msToKt(a.velocityMs))} kt`
                          : "—"
                      }
                    />
                    <KV
                      label="Heading"
                      value={
                        a.trackDeg !== null ? `${Math.round(a.trackDeg)}°` : "—"
                      }
                    />
                    <KV label="Callsign" value={a.callsign ?? "—"} />
                  </>
                ) : a.status === "parked" ? (
                  <>
                    <KV
                      label="At"
                      value={
                        near
                          ? `${near.station.icao} · ${near.station.city}`
                          : a.lat !== null && a.lon !== null
                            ? `${a.lat.toFixed(2)}, ${a.lon.toFixed(2)}`
                            : "—"
                      }
                    />
                    <KV
                      label="Distance"
                      value={
                        near ? `${near.distanceNm.toFixed(1)} nm` : "—"
                      }
                    />
                    <KV
                      label="Last seen"
                      value={timeAgo(a.lastContact)}
                    />
                    <KV label="Callsign" value={a.callsign ?? "—"} />
                  </>
                ) : (
                  <>
                    <KV label="Status" value="No live data" />
                    <KV
                      label="Note"
                      value="Not in open OpenSky feed"
                    />
                  </>
                )}
              </div>
            </div>
          );
        })}
        {sorted.length === 0 ? (
          <div className="p-8 text-xs text-jx-muted text-center flex flex-col items-center gap-2">
            <Activity className="h-5 w-5" />
            No aircraft match this filter.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatBox({
  label,
  value,
  icon,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: "healthy" | "gold" | "muted";
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-md border px-2 py-1.5 flex flex-col items-start transition-colors",
        active
          ? "bg-jx-orange-tint border-jx-orange/50"
          : "bg-white border-jx-border hover:bg-jx-panel"
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1 text-[10px] uppercase tracking-wider",
          tone === "healthy"
            ? "text-jx-healthy"
            : tone === "gold"
              ? "text-jx-gold"
              : "text-jx-muted"
        )}
      >
        {icon}
        {label}
      </div>
      <div className="font-mono text-lg text-jx-text leading-tight mt-0.5">
        {value}
      </div>
    </button>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2 min-w-0">
      <span className="text-jx-subtle">{label}</span>
      <span className="font-mono text-jx-text truncate">{value}</span>
    </div>
  );
}
