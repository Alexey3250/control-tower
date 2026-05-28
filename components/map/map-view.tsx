"use client";

import * as React from "react";
import Map, {
  Layer,
  Marker,
  NavigationControl,
  Popup,
  Source,
  type MapRef,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Feature, FeatureCollection, LineString, Polygon } from "geojson";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Cloud,
  FlaskConical,
  Layers,
  Loader2,
  MoonStar,
  ParkingSquare,
  Plane,
  Route,
  Sun,
} from "lucide-react";
import { StatusPill } from "@/components/kpi/status-pill";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { FleetPanel } from "./fleet-panel";
import { ActiveDestinationsPanel } from "./active-destinations-panel";
import { msToKt, mToFt, nearestStation } from "@/lib/geo";
import {
  nightPolygon,
  subsolarLatitude,
  subsolarLongitude,
} from "@/lib/terminator";
import {
  SIMULATED_FLIGHTS,
  computeSimulatedPosition,
  greatCirclePolyline,
} from "@/lib/sim/routes";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/lib/use-is-mobile";
import type { AircraftState } from "@/lib/data/opensky";
import type { StationKpiBundle, StationStatus } from "@/lib/types";

/**
 * CARTO Voyager — soft pastel basemap with country borders, light terrain
 * shading and label hierarchy. Gives the map enough visual density to feel
 * three-dimensional while keeping the white/minimalist Jetex aesthetic.
 */
const CARTO_LIGHT =
  "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json";

interface MapViewProps {
  snapshot: StationKpiBundle[];
}

interface AircraftResponse {
  states: AircraftState[];
  fetchedAt: string;
}

interface TrailPoint {
  lat: number;
  lon: number;
  time: number;
  altM: number | null;
}

const TRAIL_MAX_AGE_MS = 30 * 60 * 1000;
const INITIAL_ZOOM = 1.8;

/**
 * Minimum map zoom at which a station of each tier becomes visible. Lower
 * tiers stay hidden at low zoom levels to avoid stacking — e.g. France has
 * 19 destinations within ~1000km, which would otherwise pile up into a blob
 * at world view. As the user zooms in, more pins fade in progressively.
 *
 * HQ never disappears.
 */
const TIER_MIN_ZOOM: Record<"Ultra-VIP" | "VIP" | "Standard", number> = {
  "Ultra-VIP": 0,
  VIP: 2.5,
  Standard: 3.8,
};

function stationVisibleAtZoom(
  station: { tier: "Ultra-VIP" | "VIP" | "Standard"; isHQ?: boolean },
  zoom: number
): boolean {
  if (station.isHQ) return true;
  return zoom >= TIER_MIN_ZOOM[station.tier];
}

function colorForStatus(status: StationStatus) {
  switch (status) {
    case "healthy":
      return "var(--jx-status-healthy)";
    case "watch":
      return "var(--jx-status-watch)";
    case "critical":
      return "var(--jx-status-critical)";
  }
}

export function MapView({ snapshot }: MapViewProps) {
  const mapRef = React.useRef<MapRef | null>(null);
  const isMobile = useIsMobile();
  const [selectedIcao, setSelectedIcao] = React.useState<string | null>(null);
  const [hoveredIcao, setHoveredIcao] = React.useState<string | null>(null);
  const [hoveredAircraft, setHoveredAircraft] = React.useState<string | null>(
    null
  );
  const [weatherOn, setWeatherOn] = React.useState(false);
  const [aircraftOn, setAircraftOn] = React.useState(true);
  const [trailsOn, setTrailsOn] = React.useState(true);
  const [terminatorOn, setTerminatorOn] = React.useState(true);
  const [mapZoom, setMapZoom] = React.useState<number>(INITIAL_ZOOM);
  /* Tile-load state: MapLibre fires `load` once the basemap is ready.
     We use this to flip the loading overlay from "Loading globe…" to
     "Loading live data…" so the user knows what stage they're in. */
  const [mapLoaded, setMapLoaded] = React.useState(false);
  /* `layersOpen` controls the mobile "Layers" bottom sheet — the desktop
     toolbar inlines all toggles, but on phones we condense to one icon
     button that opens this sheet so the toolbar stops eating the map. */
  const [layersOpen, setLayersOpen] = React.useState(false);

  /* Recompute the day/night terminator polygon every minute. Cheap maths
     (no network). Initial value is computed at first render. */
  const [terminatorTime, setTerminatorTime] = React.useState<number>(() =>
    Date.now()
  );
  React.useEffect(() => {
    if (!terminatorOn) return;
    const id = window.setInterval(() => setTerminatorTime(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, [terminatorOn]);

  const terminator = React.useMemo<{
    night: Feature<Polygon>;
    subsolar: { lat: number; lon: number };
    label: string;
  }>(() => {
    const now = new Date(terminatorTime);
    return {
      night: nightPolygon(now),
      subsolar: {
        lat: subsolarLatitude(now),
        lon: subsolarLongitude(now),
      },
      label: now.toUTCString().slice(17, 22) + " UTC",
    };
  }, [terminatorTime]);

  /*
   * Always-on simulated flights (DWC ↔ MIA / IBZ / PEK). Position is
   * deterministic from `Date.now()` and is recomputed every 5 seconds so the
   * marker visibly moves along the great-circle without hammering the CPU.
   *
   * The dashed *route* line (origin → destination) is precomputed once because
   * it doesn't depend on time — only the aircraft marker animates along it.
   */
  const [simOn, setSimOn] = React.useState(true);
  const [simTime, setSimTime] = React.useState<number>(() => Date.now());
  React.useEffect(() => {
    if (!simOn) return;
    const id = window.setInterval(() => setSimTime(Date.now()), 5_000);
    return () => window.clearInterval(id);
  }, [simOn]);

  const simRoutesGeoJson: FeatureCollection<LineString> = React.useMemo(() => {
    return {
      type: "FeatureCollection",
      features: SIMULATED_FLIGHTS.map((flight) => ({
        type: "Feature",
        properties: {
          icao24: flight.icao24,
          tail: flight.tail,
          from: flight.origin.iata,
          to: flight.destination.iata,
        },
        geometry: {
          type: "LineString",
          coordinates: greatCirclePolyline(flight.origin, flight.destination, 96),
        },
      })),
    };
  }, []);

  const simPositions = React.useMemo(() => {
    const now = new Date(simTime);
    return SIMULATED_FLIGHTS.map((f) => computeSimulatedPosition(f, now));
  }, [simTime]);

  const [trails, setTrails] = React.useState<globalThis.Map<string, TrailPoint[]>>(
    () => new globalThis.Map()
  );

  const {
    data: aircraftRes,
    isLoading: aircraftLoading,
    isError: aircraftError,
  } = useQuery<AircraftResponse>({
    queryKey: ["live-aircraft"],
    queryFn: async () => {
      const res = await fetch("/api/aircraft", { cache: "no-store" });
      if (!res.ok) throw new Error(`aircraft fetch failed: ${res.status}`);
      return res.json();
    },
    refetchInterval: 15_000,
    enabled: aircraftOn,
  });

  const selected =
    selectedIcao !== null
      ? snapshot.find((b) => b.station.icao === selectedIcao)
      : null;
  const hovered =
    hoveredIcao !== null
      ? snapshot.find((b) => b.station.icao === hoveredIcao)
      : null;

  /*
   * Split simulated from real before any map-marker work:
   *  - real aircraft get the existing trail-accumulator + plane marker.
   *  - simulated aircraft are rendered separately with a "SIM" badge and
   *    their pre-computed dashed route line.
   * When the simulated toggle is OFF, the simulated flights are dropped from
   * the visible list entirely.
   */
  const allAircraft = aircraftRes?.states ?? [];
  const aircraft = simOn
    ? allAircraft
    : allAircraft.filter((a) => a.layer !== "simulated");
  const realAircraft = aircraft.filter((a) => a.layer !== "simulated");
  const simAircraft = aircraft.filter((a) => a.layer === "simulated");
  const onMap = aircraft.filter((a) => a.lat !== null && a.lon !== null);
  const flying = realAircraft.filter(
    (a) => a.status === "flying" && a.lat !== null && a.lon !== null
  );
  const parked = realAircraft.filter(
    (a) => a.status === "parked" && a.lat !== null && a.lon !== null
  );

  // Accumulate flight trails from successive OpenSky pulls. Subscribing to
  // an external data source (the react-query cache) is a legitimate use of
  // setState within an effect — disabled lint for that line only.
  React.useEffect(() => {
    if (!aircraftRes) return;
    const now = Date.now();
    const cutoff = now - TRAIL_MAX_AGE_MS;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTrails((prev) => {
      const next = new globalThis.Map(prev);
      let mutated = false;

      for (const a of aircraftRes.states) {
        /* Simulated demo flights use their pre-drawn great-circle line as the
           trail — skip them so the orange accumulator only carries real
           OpenSky data. */
        if (a.layer === "simulated") continue;
        if (a.status !== "flying" || a.lat === null || a.lon === null) continue;
        const existing = next.get(a.icao24) ?? [];
        const last = existing[existing.length - 1];
        let copy = existing;
        if (!last || last.lat !== a.lat || last.lon !== a.lon) {
          copy = [
            ...existing,
            { lat: a.lat, lon: a.lon, time: now, altM: a.baroAltitudeM },
          ];
          mutated = true;
        }
        const trimmed = copy.filter((p) => p.time >= cutoff);
        if (trimmed.length !== copy.length) mutated = true;
        if (trimmed.length === 0) {
          if (next.has(a.icao24)) {
            next.delete(a.icao24);
            mutated = true;
          }
        } else {
          next.set(a.icao24, trimmed);
        }
      }

      // Trim trails for aircraft no longer flying so they fade out cleanly.
      for (const [icao24, points] of next.entries()) {
        const stillFlying = aircraftRes.states.some(
          (a) => a.icao24 === icao24 && a.status === "flying"
        );
        if (!stillFlying) {
          const trimmed = points.filter((p) => p.time >= cutoff);
          if (trimmed.length === 0) {
            next.delete(icao24);
            mutated = true;
          } else if (trimmed.length !== points.length) {
            next.set(icao24, trimmed);
            mutated = true;
          }
        }
      }

      return mutated ? next : prev;
    });
  }, [aircraftRes]);

  const trailsGeoJson: FeatureCollection<LineString> = React.useMemo(() => {
    const features: FeatureCollection<LineString>["features"] = [];
    for (const [icao24, points] of trails.entries()) {
      if (points.length < 2) continue;
      features.push({
        type: "Feature",
        properties: { icao24 },
        geometry: {
          type: "LineString",
          coordinates: points.map((p) => [p.lon, p.lat]),
        },
      });
    }
    return { type: "FeatureCollection", features };
  }, [trails]);

  const hoveredAc =
    hoveredAircraft !== null
      ? aircraft.find((a) => a.icao24 === hoveredAircraft)
      : null;

  const focusAircraft = React.useCallback((a: AircraftState) => {
    if (a.lat === null || a.lon === null || !mapRef.current) return;
    mapRef.current.flyTo({
      center: [a.lon, a.lat],
      zoom: a.status === "flying" ? 5 : 9,
      duration: 1400,
    });
    setHoveredAircraft(a.icao24);
    window.setTimeout(() => setHoveredAircraft(null), 4000);
  }, []);

  return (
    <div className="relative flex-1 min-h-0">
      <Map
        ref={mapRef}
        mapStyle={CARTO_LIGHT}
        initialViewState={{
          longitude: 30,
          latitude: 28,
          zoom: INITIAL_ZOOM,
        }}
        onMove={(e) => setMapZoom(e.viewState.zoom)}
        onLoad={() => setMapLoaded(true)}
        attributionControl={{ compact: true }}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {terminatorOn ? (
          <Source id="night-terminator" type="geojson" data={terminator.night}>
            {/* Soft fill that darkens the night-side land/sea */}
            <Layer
              id="night-terminator-fill"
              type="fill"
              paint={{
                "fill-color": "#0b1a30",
                "fill-opacity": 0.18,
                "fill-antialias": true,
              }}
            />
            {/* Hairline along the terminator great-circle for a clean edge */}
            <Layer
              id="night-terminator-line"
              type="line"
              paint={{
                "line-color": "#0b1a30",
                "line-opacity": 0.35,
                "line-width": 0.5,
              }}
            />
          </Source>
        ) : null}

        {/* Subsolar marker — the spot on Earth where the sun is overhead. */}
        {terminatorOn ? (
          <Marker
            longitude={terminator.subsolar.lon}
            latitude={terminator.subsolar.lat}
            anchor="center"
          >
            <div
              className="pointer-events-none rounded-full"
              style={{
                width: 14,
                height: 14,
                background:
                  "radial-gradient(circle, rgba(255,200,80,0.95) 0%, rgba(255,200,80,0.45) 50%, rgba(255,200,80,0) 80%)",
              }}
            />
          </Marker>
        ) : null}

        {trailsOn && trailsGeoJson.features.length > 0 ? (
          <Source
            id="aircraft-trails"
            type="geojson"
            data={trailsGeoJson}
            lineMetrics
          >
            <Layer
              id="aircraft-trails-line"
              type="line"
              layout={{ "line-cap": "round", "line-join": "round" }}
              paint={{
                "line-width": 2.5,
                "line-gradient": [
                  "interpolate",
                  ["linear"],
                  ["line-progress"],
                  0,
                  "rgba(243, 112, 33, 0)",
                  0.4,
                  "rgba(243, 112, 33, 0.45)",
                  1,
                  "rgba(243, 112, 33, 0.95)",
                ],
              }}
            />
          </Source>
        ) : null}

        {/* Simulated DWC ↔ MIA / IBZ / PEK route lines. Dashed + de-saturated
            so the user immediately sees they are demo data, not real telemetry. */}
        {simOn ? (
          <Source
            id="sim-routes"
            type="geojson"
            data={simRoutesGeoJson}
          >
            {/* Soft outer glow for legibility on the light basemap */}
            <Layer
              id="sim-routes-glow"
              type="line"
              layout={{ "line-cap": "round", "line-join": "round" }}
              paint={{
                "line-color": "#1f6aa6",
                "line-width": 5,
                "line-opacity": 0.08,
              }}
            />
            <Layer
              id="sim-routes-dash"
              type="line"
              layout={{ "line-cap": "butt", "line-join": "round" }}
              paint={{
                "line-color": "#1f6aa6",
                "line-width": 1.6,
                "line-opacity": 0.85,
                "line-dasharray": [3, 3],
              }}
            />
          </Source>
        ) : null}

        {/*
          Simulated route endpoint pills were removed: DWC, MIA (KOPF), IBZ
          and PEK are *all* Jetex destinations, so the regular station
          markers already pin them. The dashed blue route line is enough to
          show where the demo flights are flying.
        */}

        {weatherOn &&
          snapshot.map((b) =>
            b.weather ? (
              <Marker
                key={`wx-${b.station.icao}`}
                longitude={b.station.lon}
                latitude={b.station.lat}
                anchor="center"
              >
                <div
                  className="pointer-events-none"
                  style={{ transform: `translate(18px, -18px)` }}
                >
                  <div className="bg-white/95 border border-jx-border rounded px-1.5 py-0.5 text-[10px] font-mono whitespace-nowrap text-jx-orange-deep shadow-sm">
                    {b.weather.windKt}kt
                  </div>
                </div>
              </Marker>
            ) : null
          )}

        {snapshot.map((b) => {
          const isHQ = !!b.station.isHQ;
          const isUltra = b.station.tier === "Ultra-VIP" || isHQ;
          const isVip = b.station.tier === "VIP";

          /* Progressive reveal: hide low-tier markers at low zoom levels so
             they don't pile up over France / Morocco / Spain. The user can
             zoom in to reveal more. Selected/hovered stations are always
             rendered regardless of zoom. */
          const forceVisible =
            selectedIcao === b.station.icao || hoveredIcao === b.station.icao;
          if (!forceVisible && !stationVisibleAtZoom(b.station, mapZoom)) {
            return null;
          }

          /* Pin core size (orange circle). Tier-driven so HQ stands out. */
          const dotSize = isHQ ? 20 : isUltra ? 16 : isVip ? 12 : 9;
          /* Labels only appear when hovered, for HQ at any zoom, or for
             higher tiers once the map is zoomed in past the country level. */
          const showLabel =
            hoveredIcao === b.station.icao ||
            isHQ ||
            (isUltra && mapZoom >= 2) ||
            (isVip && mapZoom >= 3.5);
          const statusColor = colorForStatus(b.current.status);

          return (
            <Marker
              key={b.station.icao}
              longitude={b.station.lon}
              latitude={b.station.lat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation();
                setSelectedIcao(b.station.icao);
              }}
            >
              <button
                onMouseEnter={() => setHoveredIcao(b.station.icao)}
                onMouseLeave={() => setHoveredIcao(null)}
                className="group relative grid place-items-center cursor-pointer"
                aria-label={b.station.name}
                style={{ width: dotSize + 8, height: dotSize + 8 }}
              >
                {/* HQ + Ultra-VIP get an animated outer ring */}
                {isHQ ? (
                  <span
                    className="absolute rounded-full animate-ping"
                    style={{
                      height: dotSize + 14,
                      width: dotSize + 14,
                      background: "rgba(243, 112, 33, 0.28)",
                    }}
                  />
                ) : null}
                {isUltra ? (
                  <span
                    className="absolute rounded-full"
                    style={{
                      height: dotSize + 10,
                      width: dotSize + 10,
                      boxShadow:
                        "0 0 0 1.5px rgba(243, 112, 33, 0.9), 0 0 12px rgba(243, 112, 33, 0.3)",
                    }}
                  />
                ) : null}

                {/* Brand-orange pin core, white ring, drop shadow for depth on the light map */}
                <span
                  className="relative rounded-full border-2 border-white"
                  style={{
                    background: "var(--jx-orange)",
                    height: dotSize,
                    width: dotSize,
                    boxShadow:
                      "0 1px 3px rgba(17,17,17,0.25), 0 2px 8px rgba(243,112,33,0.25)",
                  }}
                />

                {/* Tiny ops-status dot at the upper-right of the pin */}
                <span
                  className="absolute rounded-full border border-white"
                  style={{
                    background: statusColor,
                    height: Math.max(5, dotSize / 3),
                    width: Math.max(5, dotSize / 3),
                    top: 0,
                    right: 0,
                    boxShadow: "0 0 0 1px rgba(17,17,17,0.18)",
                  }}
                />

                {isHQ ? (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[9px] font-bold text-jx-orange-deep tracking-[0.18em]">
                    HQ
                  </span>
                ) : null}

                {showLabel && b.station.iata ? (
                  <span
                    className={cn(
                      "absolute pointer-events-none whitespace-nowrap rounded px-1.5 py-0.5 font-mono text-[10px] border bg-white/95 shadow-sm",
                      isHQ
                        ? "text-jx-orange-deep border-jx-orange/60 font-semibold"
                        : isUltra
                          ? "text-jx-orange-deep border-jx-orange/40"
                          : isVip
                            ? "text-jx-text border-jx-border"
                            : "text-jx-muted border-jx-border"
                    )}
                    style={{
                      transform: `translate(${dotSize / 2 + 10}px, 0)`,
                    }}
                  >
                    {b.station.iata}
                  </span>
                ) : null}
              </button>
            </Marker>
          );
        })}

        {aircraftOn &&
          parked.map((a) =>
            a.lat !== null && a.lon !== null ? (
              <Marker
                key={`parked-${a.icao24}`}
                longitude={a.lon}
                latitude={a.lat}
                anchor="center"
              >
                <button
                  onMouseEnter={() => setHoveredAircraft(a.icao24)}
                  onMouseLeave={() => setHoveredAircraft(null)}
                  className="group relative grid place-items-center"
                  aria-label={a.tail}
                >
                  <span
                    className={cn(
                      "h-4 w-4 rounded-full grid place-items-center bg-white border border-jx-orange/60 group-hover:border-jx-orange transition-all shadow-sm"
                    )}
                  >
                    <ParkingSquare className="h-2.5 w-2.5 text-jx-orange" />
                  </span>
                </button>
              </Marker>
            ) : null
          )}

        {aircraftOn &&
          flying.map((a) =>
            a.lat !== null && a.lon !== null ? (
              <Marker
                key={`flying-${a.icao24}`}
                longitude={a.lon}
                latitude={a.lat}
                anchor="center"
                rotation={a.trackDeg ?? 0}
              >
                <button
                  onMouseEnter={() => setHoveredAircraft(a.icao24)}
                  onMouseLeave={() => setHoveredAircraft(null)}
                  className="relative grid place-items-center"
                  aria-label={a.tail}
                >
                  <Plane
                    className="h-4 w-4 text-jx-orange drop-shadow-[0_1px_3px_rgba(17,17,17,0.35)]"
                    fill="currentColor"
                  />
                </button>
              </Marker>
            ) : null
          )}

        {/* Simulated demo flights — same Plane glyph but in route-blue with a
            stitched halo and a "SIM" pill so reviewers can immediately tell
            them apart from real OpenSky telemetry. */}
        {aircraftOn && simOn
          ? simAircraft.map((a) =>
              a.lat !== null && a.lon !== null ? (
                <Marker
                  key={`sim-${a.icao24}`}
                  longitude={a.lon}
                  latitude={a.lat}
                  anchor="center"
                >
                  <button
                    onMouseEnter={() => setHoveredAircraft(a.icao24)}
                    onMouseLeave={() => setHoveredAircraft(null)}
                    className="relative grid place-items-center"
                    aria-label={`${a.tail} (simulated)`}
                  >
                    <span
                      className="absolute rounded-full"
                      style={{
                        width: 22,
                        height: 22,
                        background:
                          "radial-gradient(circle, rgba(31,106,166,0.25) 0%, rgba(31,106,166,0) 70%)",
                      }}
                    />
                    <span
                      style={{
                        transform: `rotate(${a.trackDeg ?? 0}deg)`,
                        display: "inline-flex",
                      }}
                    >
                      <Plane
                        className="h-4 w-4 drop-shadow-[0_1px_3px_rgba(17,17,17,0.35)]"
                        fill="#1f6aa6"
                        color="#1f6aa6"
                      />
                    </span>
                    <span
                      className="absolute -top-3 px-1 py-px rounded-sm text-[8px] font-bold tracking-[0.1em] uppercase"
                      style={{
                        background: "rgba(31,106,166,0.92)",
                        color: "white",
                      }}
                    >
                      SIM
                    </span>
                  </button>
                </Marker>
              ) : null
            )
          : null}

        {hovered && hoveredIcao !== selectedIcao ? (
          <Popup
            longitude={hovered.station.lon}
            latitude={hovered.station.lat}
            anchor="bottom"
            closeButton={false}
            closeOnClick={false}
            offset={14}
          >
            <div className="p-2.5 text-xs space-y-1 min-w-[200px]">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-semibold text-jx-text truncate">
                    {hovered.station.city}
                  </div>
                  <div className="text-[10px] text-jx-subtle">
                    {hovered.station.country}
                  </div>
                </div>
                <span className="font-mono text-jx-orange-deep text-[11px]">
                  {hovered.station.icao}
                  {hovered.station.iata ? ` · ${hovered.station.iata}` : ""}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px]">
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: colorForStatus(hovered.current.status) }}
                />
                <span className="uppercase tracking-wider text-jx-muted">
                  {hovered.current.status}
                </span>
                <span className="text-jx-subtle">·</span>
                <span className="text-jx-muted">
                  {hovered.station.tier}
                  {hovered.station.isHQ ? " · HQ" : ""}
                </span>
              </div>
              <div className="flex items-center justify-between text-jx-muted pt-1 border-t border-jx-border">
                <span>Risk</span>
                <span className="font-mono text-jx-text">
                  {hovered.current.riskScore}
                </span>
              </div>
              <div className="flex items-center justify-between text-jx-muted">
                <span>Turns 24h</span>
                <span className="font-mono text-jx-text">
                  {hovered.current.turnsLast24h}
                </span>
              </div>
            </div>
          </Popup>
        ) : null}

        {hoveredAc && hoveredAc.lat !== null && hoveredAc.lon !== null ? (
          <Popup
            longitude={hoveredAc.lon}
            latitude={hoveredAc.lat}
            anchor="bottom"
            closeButton={false}
            closeOnClick={false}
            offset={14}
          >
            <AircraftPopup state={hoveredAc} />
          </Popup>
        ) : null}
      </Map>

      {/*
        Top toolbar.
        - Desktop: full two-cluster layout (status badges | layer toggles).
        - Mobile: single condensed bar — small JETEX·status pill on the
          left, single "Layers" icon on the right which opens a bottom
          sheet containing every layer toggle. This stops a 5-button row
          + 7-badge row from eating the upper half of a phone screen.
      */}
      <div className="absolute top-3 md:top-4 left-3 md:left-4 right-3 md:right-4 flex items-start md:items-center justify-between gap-2 md:gap-3 pointer-events-none">
        <div className="flex items-center gap-1.5 pointer-events-auto flex-wrap bg-white/95 backdrop-blur rounded-md border border-jx-border px-2 py-1.5 shadow-sm max-w-[calc(100vw-7rem)] md:max-w-none overflow-x-auto">
          <Badge variant="gold" className="font-mono text-[10px] tracking-[0.18em] shrink-0">
            JETEX · {snapshot.length}
          </Badge>
          <span className="mx-0.5 text-jx-subtle hidden md:inline">·</span>
          <Badge variant="healthy" className="font-mono shrink-0">
            {snapshot.filter((s) => s.current.status === "healthy").length}
          </Badge>
          <Badge variant="watch" className="font-mono shrink-0">
            {snapshot.filter((s) => s.current.status === "watch").length}
          </Badge>
          <Badge variant="critical" className="font-mono shrink-0">
            {snapshot.filter((s) => s.current.status === "critical").length}
          </Badge>
          {/* Flying / parked / "+N at higher zoom" are useful but secondary —
              hide on mobile to keep the pill compact. */}
          <span className="mx-0.5 text-jx-subtle hidden md:inline">·</span>
          <Badge variant="outline" className="font-mono hidden md:inline-flex">
            <span className="text-jx-healthy">{flying.length}</span> flying
          </Badge>
          <Badge variant="outline" className="font-mono hidden md:inline-flex">
            <span className="text-jx-orange">{parked.length}</span> parked
          </Badge>
          {(() => {
            const hidden = snapshot.filter(
              (s) => !stationVisibleAtZoom(s.station, mapZoom)
            ).length;
            return hidden > 0 ? (
              <Badge
                variant="outline"
                className="font-mono text-[10px] text-jx-muted hidden md:inline-flex"
                title="Zoom in to reveal smaller-tier destinations"
              >
                +{hidden} at higher zoom
              </Badge>
            ) : null;
          })()}
        </div>

        {/* Desktop layer toggles — inline. */}
        <div className="hidden md:flex items-center gap-1.5 pointer-events-auto flex-wrap">
          {/*
            Tailwind quirk reminder: when variant="gold" runs through cva, it
            sets `bg-accent text-accent-foreground` (orange + white). If we
            also append `bg-white/95` in className it overrides the orange and
            leaves WHITE text on a WHITE background. So only force the white
            backdrop when the button is *inactive* (variant="outline" / no bg).
          */}
          <Button
            size="sm"
            variant={aircraftOn ? "gold" : "outline"}
            onClick={() => setAircraftOn((v) => !v)}
            className={!aircraftOn ? "bg-white/95 text-jx-text" : ""}
          >
            <Plane className="h-3.5 w-3.5" />
            Aircraft ({onMap.length}/{aircraft.length})
          </Button>
          <Button
            size="sm"
            variant={trailsOn ? "gold" : "outline"}
            onClick={() => setTrailsOn((v) => !v)}
            disabled={!aircraftOn}
            className={!trailsOn ? "bg-white/95 text-jx-text" : ""}
          >
            <Route className="h-3.5 w-3.5" />
            Trails ({trailsGeoJson.features.length})
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSimOn((v) => !v)}
            className={cn(
              simOn
                ? "!bg-[#1f6aa6] !text-white border-[#1f6aa6] hover:!bg-[#1a5b91] hover:!text-white"
                : "bg-white/95 text-jx-text"
            )}
            title="3 always-on simulated demo flights: DWC ↔ MIA, DWC ↔ IBZ, DWC ↔ PEK"
          >
            <FlaskConical className="h-3.5 w-3.5" />
            SIM ({simPositions.length})
          </Button>
          <Button
            size="sm"
            variant={terminatorOn ? "gold" : "outline"}
            onClick={() => setTerminatorOn((v) => !v)}
            className={!terminatorOn ? "bg-white/95 text-jx-text" : ""}
            title={`Day / night terminator — subsolar point ${terminator.subsolar.lat.toFixed(1)}°, ${terminator.subsolar.lon.toFixed(1)}° at ${terminator.label}`}
          >
            {terminatorOn ? (
              <MoonStar className="h-3.5 w-3.5" />
            ) : (
              <Sun className="h-3.5 w-3.5" />
            )}
            Day/Night
          </Button>
          <Button
            size="sm"
            variant={weatherOn ? "gold" : "outline"}
            onClick={() => setWeatherOn((v) => !v)}
            className={!weatherOn ? "bg-white/95 text-jx-text" : ""}
          >
            <Cloud className="h-3.5 w-3.5" />
            Weather
          </Button>
        </div>

        {/* Mobile: single Layers trigger opens a bottom sheet with all toggles. */}
        <Drawer open={layersOpen} onOpenChange={setLayersOpen}>
          <DrawerTrigger asChild>
            <Button
              size="sm"
              variant="outline"
              className="md:hidden pointer-events-auto bg-white/95 text-jx-text shrink-0 shadow-sm"
              aria-label="Open map layers"
            >
              <Layers className="h-3.5 w-3.5" />
              Layers
            </Button>
          </DrawerTrigger>
          <DrawerContent side="bottom" className="max-h-[60vh]">
            <DrawerHeader>
              <DrawerTitle className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-jx-orange" />
                Map layers
              </DrawerTitle>
            </DrawerHeader>
            <DrawerBody className="space-y-2">
              <LayerToggleRow
                icon={<Plane className="h-4 w-4" />}
                label="Aircraft"
                hint={`${onMap.length} on map · ${aircraft.length} tracked`}
                active={aircraftOn}
                onToggle={() => setAircraftOn((v) => !v)}
              />
              <LayerToggleRow
                icon={<Route className="h-4 w-4" />}
                label="Trails"
                hint={`${trailsGeoJson.features.length} active flight trails`}
                active={trailsOn}
                disabled={!aircraftOn}
                onToggle={() => setTrailsOn((v) => !v)}
              />
              <LayerToggleRow
                icon={<FlaskConical className="h-4 w-4" />}
                label="Simulated flights"
                hint={`${simPositions.length} demo · DWC ↔ MIA / IBZ / PEK`}
                active={simOn}
                accent="#1f6aa6"
                onToggle={() => setSimOn((v) => !v)}
              />
              <LayerToggleRow
                icon={
                  terminatorOn ? (
                    <MoonStar className="h-4 w-4" />
                  ) : (
                    <Sun className="h-4 w-4" />
                  )
                }
                label="Day / Night"
                hint={`Terminator at ${terminator.label}`}
                active={terminatorOn}
                onToggle={() => setTerminatorOn((v) => !v)}
              />
              <LayerToggleRow
                icon={<Cloud className="h-4 w-4" />}
                label="Weather"
                hint="Per-station wind speed overlay"
                active={weatherOn}
                onToggle={() => setWeatherOn((v) => !v)}
              />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </div>

      {/*
        Loading + error overlay.
        Order of states:
          1. Map tiles still rendering → "Loading globe…"
          2. Tiles ready but aircraft endpoint hasn't returned → "Loading live data…"
          3. Aircraft endpoint failed (rate-limit, network blip) → red banner.
        Once aircraft data is in the cache, the overlay vanishes entirely.
      */}
      {!mapLoaded || (aircraftOn && aircraftLoading && !aircraftRes) ? (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="pointer-events-auto bg-white/96 backdrop-blur border border-jx-border rounded-lg shadow-xl px-5 py-4 flex items-center gap-3 max-w-[88vw]">
            <Loader2 className="h-5 w-5 text-jx-orange animate-spin shrink-0" />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-jx-text">
                {!mapLoaded
                  ? "Loading globe…"
                  : "Loading live aircraft from OpenSky…"}
              </div>
              <div className="text-[11px] text-jx-muted">
                {!mapLoaded
                  ? "Fetching CARTO Voyager basemap tiles"
                  : `${snapshot.length} Jetex destinations ready · streaming live state vectors`}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {aircraftError && aircraftOn ? (
        <div className="absolute top-20 md:top-20 left-1/2 -translate-x-1/2 z-10 pointer-events-auto bg-red-50 border border-red-300 text-red-800 rounded-md px-3 py-2 text-xs shadow-md flex items-center gap-2 max-w-[88vw]">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>
            OpenSky unreachable — showing simulated flights only.{" "}
            <span className="font-mono">retrying every 30s</span>
          </span>
        </div>
      ) : null}

      {aircraftOn ? (
        <>
        <ActiveDestinationsPanel
          aircraft={aircraft}
          snapshot={snapshot}
          defaultOpen={!isMobile}
        />
        <FleetPanel
          aircraft={aircraft}
          fetchedAt={aircraftRes?.fetchedAt}
          onFocus={focusAircraft}
          defaultOpen={!isMobile}
        />
        </>
      ) : null}

      {aircraft.length === 0 && aircraftOn ? (
        <div className="absolute bottom-6 left-3 md:left-6 max-w-md bg-white/98 border border-jx-border rounded-md p-3 text-xs text-jx-muted shadow-lg">
          <div className="font-semibold text-jx-text mb-0.5">
            No tracked aircraft live
          </div>
          OpenSky returned no state vectors. Confirm fleet ICAO24 hex codes in{" "}
          <span className="font-mono text-jx-orange">config/fleet.ts</span>.
        </div>
      ) : null}

      <Drawer open={selected !== null} onOpenChange={(o) => !o && setSelectedIcao(null)}>
        <DrawerContent>
          {selected ? (
            <>
              <DrawerHeader>
                <div className="flex items-center gap-3">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ background: colorForStatus(selected.current.status) }}
                  />
                  <div className="flex-1">
                    <DrawerTitle>{selected.station.name}</DrawerTitle>
                    <div className="text-xs text-jx-muted font-mono mt-1">
                      {selected.station.icao} · {selected.station.iata} ·{" "}
                      {selected.station.city}, {selected.station.country}
                    </div>
                  </div>
                </div>
              </DrawerHeader>
              <DrawerBody>
                <div className="flex items-center gap-2">
                  <StatusPill status={selected.current.status} />
                  <Badge variant="outline">
                    Risk {selected.current.riskScore}
                  </Badge>
                  <Badge variant="secondary">{selected.station.tier}</Badge>
                </div>

                <KpiRow label="Turns · 24h" value={selected.current.turnsLast24h} />
                <KpiRow label="PAX · 24h" value={selected.current.paxLast24h} />
                <KpiRow
                  label="Slot compliance"
                  value={`${Math.round(selected.current.slotCompliance * 100)}%`}
                />
                <KpiRow
                  label="Ramp efficiency"
                  value={`${Math.round(selected.current.rampEfficiency * 100)}%`}
                />
                <KpiRow
                  label="Manpower coverage"
                  value={`${Math.round(selected.current.manpowerCoverage * 100)}%`}
                />
                <KpiRow
                  label="Avg turnaround"
                  value={`${selected.current.avgTurnaroundMin} min`}
                />
                <KpiRow
                  label="Vendor breaches (7d)"
                  value={selected.current.vendorBreaches7d}
                />
                <KpiRow
                  label="Open incidents"
                  value={selected.current.openIncidents}
                />
                <KpiRow
                  label="Cost variance"
                  value={`${selected.current.costVariancePct.toFixed(1)}%`}
                />

                {selected.weather ? (
                  <div className="pt-3 border-t border-jx-border space-y-1">
                    <div className="text-[10px] uppercase tracking-wider text-jx-muted">
                      Current weather
                    </div>
                    <div className="font-mono text-xs text-jx-text">
                      {selected.metar}
                    </div>
                    <div className="text-xs text-jx-muted">
                      Wind {selected.weather.windKt}kt · gust{" "}
                      {selected.weather.gustKt}kt · {selected.weather.tempC}°C ·{" "}
                      {selected.weather.condition}
                    </div>
                  </div>
                ) : null}

                <Button asChild variant="gold" className="w-full mt-4">
                  <a href={`/stations/${selected.station.icao}`}>
                    Open station detail
                  </a>
                </Button>
              </DrawerBody>
            </>
          ) : null}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

function AircraftPopup({ state }: { state: AircraftState }) {
  const near =
    state.lat !== null && state.lon !== null
      ? nearestStation(state.lat, state.lon, 600)
      : null;
  const isSim = state.layer === "simulated";

  return (
    <div className="p-2.5 text-xs min-w-[240px] space-y-1.5">
      {isSim ? (
        <div
          className="-mx-2.5 -mt-2.5 mb-1 px-2.5 py-1 text-[9px] font-bold tracking-[0.18em] uppercase text-white"
          style={{ background: "#1f6aa6" }}
        >
          Simulated demo · not live telemetry
        </div>
      ) : null}
      <div className="flex items-center justify-between gap-3">
        <span className="font-semibold text-jx-text font-mono">{state.tail}</span>
        <Badge
          variant={
            state.status === "flying"
              ? "healthy"
              : state.status === "parked"
                ? "gold"
                : "secondary"
          }
          className="text-[9px]"
        >
          {state.status}
        </Badge>
      </div>
      <div className="text-jx-muted text-[11px]">
        {state.model} · {state.typeCode}
      </div>
      {state.broadcastOperator ? (
        <div className="text-[10px] text-jx-subtle">
          {isSim ? "Route" : "FR24 operator"}: {state.broadcastOperator}
        </div>
      ) : null}
      {state.status === "flying" ? (
        <div className="space-y-0.5 text-[11px] pt-1 border-t border-jx-border">
          <KV label="Altitude">
            {state.baroAltitudeM !== null
              ? `${Math.round(mToFt(state.baroAltitudeM)).toLocaleString()} ft`
              : "—"}
          </KV>
          <KV label="Speed">
            {state.velocityMs !== null
              ? `${Math.round(msToKt(state.velocityMs))} kt`
              : "—"}
          </KV>
          <KV label="Heading">
            {state.trackDeg !== null ? `${Math.round(state.trackDeg)}°` : "—"}
          </KV>
          <KV label="Callsign">{state.callsign ?? "—"}</KV>
        </div>
      ) : (
        <div className="space-y-0.5 text-[11px] pt-1 border-t border-jx-border">
          <KV label="At">
            {near
              ? `${near.station.icao} · ${near.station.city}`
              : `${state.lat?.toFixed(2)}, ${state.lon?.toFixed(2)}`}
          </KV>
          {near ? <KV label="Distance">{near.distanceNm.toFixed(1)} nm</KV> : null}
          <KV label="Country">{state.originCountry || "—"}</KV>
        </div>
      )}
    </div>
  );
}

function KpiRow({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center justify-between text-sm py-1.5 border-b border-jx-border/60 last:border-0">
      <span className="text-jx-muted">{label}</span>
      <span className="font-mono text-jx-text">{value}</span>
    </div>
  );
}

function KV({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-jx-muted">{label}</span>
      <span className="font-mono text-jx-text">{children}</span>
    </div>
  );
}

/**
 * Tap-friendly toggle row for the mobile "Layers" bottom sheet. Big hit
 * area, clear on/off indicator, optional accent colour for non-orange
 * layers like the blue simulated-flights track.
 */
function LayerToggleRow({
  icon,
  label,
  hint,
  active,
  disabled,
  accent,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  active: boolean;
  disabled?: boolean;
  accent?: string;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={cn(
        "w-full flex items-center gap-3 rounded-md border px-3 py-3 text-left transition-colors",
        active
          ? "border-jx-orange/50 bg-jx-orange-tint/60"
          : "border-jx-border bg-white hover:bg-jx-panel/60",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      style={
        active && accent
          ? { borderColor: accent, background: `${accent}14` }
          : undefined
      }
    >
      <span
        className={cn(
          "shrink-0 h-9 w-9 rounded-md grid place-items-center",
          active ? "bg-white" : "bg-jx-panel"
        )}
        style={active && accent ? { color: accent } : undefined}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-jx-text leading-tight">
          {label}
        </div>
        <div className="text-[11px] text-jx-muted leading-snug">{hint}</div>
      </div>
      <span
        className={cn(
          "shrink-0 text-[10px] font-bold tracking-[0.18em] uppercase px-2 py-0.5 rounded-full border",
          active
            ? "text-white border-transparent"
            : "text-jx-muted bg-white border-jx-border"
        )}
        style={
          active
            ? { background: accent ?? "var(--jx-orange)" }
            : undefined
        }
      >
        {active ? "On" : "Off"}
      </span>
    </button>
  );
}
