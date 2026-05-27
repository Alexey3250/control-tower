/**
 * Simulated flight routes.
 *
 * Three deterministic "always-on" flights running back and forth between
 * DWC (Al Maktoum / Jetex HQ) and three real recent Jetex-served city pairs:
 *
 *   DWC ↔ MIA   ultra-long-range transatlantic (Global 7500 demo)
 *   DWC ↔ IBZ   medium-range Mediterranean (Citation Longitude demo)
 *   DWC ↔ PEK   long-range Asia (Gulfstream G650ER demo)
 *
 * These flights are NOT real telemetry — they are clearly labelled as
 * `layer: "simulated"` and `uiStatus: "simulated"` everywhere they appear,
 * and the map renders their leg as a dashed great-circle line so the user
 * can immediately tell them apart from real OpenSky-broadcast aircraft.
 *
 * Why simulated demos exist:
 *   - The free OpenSky public feed often has gaps for Middle-East-registered
 *     business jets, so the live map can sit empty for long stretches.
 *   - For a portfolio demo, we want at least three guaranteed-moving aircraft
 *     so reviewers can verify trails, popups, day/night terminator, and the
 *     active-destinations panel.
 *   - Each simulated flight runs on a deterministic clock so the position is
 *     identical on every render across the SSR boundary and across reloads.
 *
 * No imports from `next/...` or `server-only` — this module is safe to import
 * from both the server (`/api/aircraft`) and the client (map polyline layer).
 */

export interface RouteAirport {
  icao: string;
  iata: string;
  name: string;
  city: string;
  /** Latitude in decimal degrees, north positive. */
  lat: number;
  /** Longitude in decimal degrees, east positive. */
  lon: number;
}

export interface SimulatedFlight {
  /** Synthetic ICAO24 (6 hex chars), deliberately outside any real allocation. */
  icao24: string;
  /** Synthetic tail — `9H-SIM*` flags it as Maltese demo registration. */
  tail: string;
  /** Synthetic callsign shown in popups/panel. */
  callsign: string;
  typeCode: string;
  model: string;
  jetexRelationship: string;
  /** Cruise speed in knots — used to derive leg duration from route distance. */
  cruiseSpeedKt: number;
  /** Cruise altitude in feet — flat profile, no climb/descent modelling. */
  cruiseAltitudeFt: number;
  origin: RouteAirport;
  destination: RouteAirport;
  /**
   * Phase offset (0..1) so the three flights start at different points along
   * their cycles — keeps the map busy at any wall-clock time.
   */
  phaseOffset: number;
}

const DWC: RouteAirport = {
  icao: "OMDW",
  iata: "DWC",
  name: "Al Maktoum International (Jetex HQ)",
  city: "Dubai",
  lat: 24.8967,
  lon: 55.1614,
};

export const SIMULATED_FLIGHTS: SimulatedFlight[] = [
  {
    icao24: "f1f1f1",
    tail: "9H-SIMA",
    callsign: "SIMMIA01",
    typeCode: "GL7T",
    model: "Bombardier Global 7500",
    jetexRelationship: "Simulated demo flight (DWC ↔ MIA)",
    cruiseSpeedKt: 488,
    cruiseAltitudeFt: 45000,
    origin: DWC,
    destination: {
      icao: "KOPF",
      iata: "OPF",
      name: "Miami-Opa Locka Executive",
      city: "Miami",
      lat: 25.907,
      lon: -80.2784,
    },
    phaseOffset: 0.0,
  },
  {
    icao24: "f2f2f2",
    tail: "9H-SIMB",
    callsign: "SIMIBZ01",
    typeCode: "GLF5",
    model: "Gulfstream G550",
    jetexRelationship: "Simulated demo flight (DWC ↔ IBZ)",
    cruiseSpeedKt: 459,
    cruiseAltitudeFt: 41000,
    origin: DWC,
    destination: {
      icao: "LEIB",
      iata: "IBZ",
      name: "Ibiza",
      city: "Ibiza",
      lat: 38.8729,
      lon: 1.3731,
    },
    phaseOffset: 0.35,
  },
  {
    icao24: "f3f3f3",
    tail: "9H-SIMC",
    callsign: "SIMPEK01",
    typeCode: "GLF6",
    model: "Gulfstream G650ER",
    jetexRelationship: "Simulated demo flight (DWC ↔ PEK)",
    cruiseSpeedKt: 488,
    cruiseAltitudeFt: 43000,
    origin: DWC,
    destination: {
      icao: "ZBAA",
      iata: "PEK",
      name: "Beijing Capital",
      city: "Beijing",
      lat: 40.0801,
      lon: 116.5847,
    },
    phaseOffset: 0.68,
  },
];

/* ────────────────────────────────────────────────────────────────────────── */
/*  Great-circle math                                                         */
/* ────────────────────────────────────────────────────────────────────────── */

const EARTH_RADIUS_KM = 6371;
const KNOT_TO_KMH = 1.852;

function rad(d: number) {
  return (d * Math.PI) / 180;
}
function deg(r: number) {
  return (r * 180) / Math.PI;
}

/** Haversine great-circle distance in km. */
export function greatCircleDistanceKm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
): number {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(s)));
}

/** Initial bearing (deg, 0..360) at `from` heading toward `to`. */
export function initialBearingDeg(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number }
): number {
  const φ1 = rad(from.lat);
  const φ2 = rad(to.lat);
  const Δλ = rad(to.lon - from.lon);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) -
    Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

/**
 * Spherical-linear-interpolation along the great-circle joining `start` and
 * `end`. `fraction` 0 → start, 1 → end. Handles antipodal degeneracy safely
 * by returning `start` when the angular distance is ~zero.
 */
export function greatCircleIntermediate(
  start: { lat: number; lon: number },
  end: { lat: number; lon: number },
  fraction: number
): { lat: number; lon: number } {
  const φ1 = rad(start.lat);
  const λ1 = rad(start.lon);
  const φ2 = rad(end.lat);
  const λ2 = rad(end.lon);
  const Δφ = φ2 - φ1;
  const Δλ = λ2 - λ1;
  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const d = 2 * Math.asin(Math.min(1, Math.sqrt(a)));
  if (d < 1e-9) return { lat: start.lat, lon: start.lon };

  const A = Math.sin((1 - fraction) * d) / Math.sin(d);
  const B = Math.sin(fraction * d) / Math.sin(d);
  const x = A * Math.cos(φ1) * Math.cos(λ1) + B * Math.cos(φ2) * Math.cos(λ2);
  const y = A * Math.cos(φ1) * Math.sin(λ1) + B * Math.cos(φ2) * Math.sin(λ2);
  const z = A * Math.sin(φ1) + B * Math.sin(φ2);

  return {
    lat: deg(Math.atan2(z, Math.sqrt(x * x + y * y))),
    lon: deg(Math.atan2(y, x)),
  };
}

/** Generate a poly-line (lon/lat pairs) for the great-circle from a to b. */
export function greatCirclePolyline(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number },
  segments = 96
): [number, number][] {
  const points: [number, number][] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const p = greatCircleIntermediate(a, b, t);
    points.push([p.lon, p.lat]);
  }
  return points;
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Position computation                                                      */
/* ────────────────────────────────────────────────────────────────────────── */

export interface SimulatedPosition {
  flight: SimulatedFlight;
  /** Aircraft latitude, decimal degrees. */
  lat: number;
  /** Aircraft longitude, decimal degrees. */
  lon: number;
  /** Heading along the great-circle in degrees (0..360). */
  trackDeg: number;
  /** Cruise altitude in metres. */
  baroAltitudeM: number;
  /** Cruise speed in metres / second. */
  velocityMs: number;
  /**
   * Active leg — origin/destination get swapped on the return leg so the UI
   * can show "FROM → TO" correctly regardless of direction.
   */
  legFrom: RouteAirport;
  legTo: RouteAirport;
  /** 0..1 progress along the current leg. */
  legProgress: number;
  /** "outbound" = origin → destination, "inbound" = destination → origin. */
  legDirection: "outbound" | "inbound";
  /** Round-trip cycle duration in milliseconds (sanity / debug). */
  cycleMs: number;
}

/**
 * Compute the simulated position of `flight` at the given instant.
 *
 * Behaviour:
 *   - Round-trip cycle = 2 × one-way flight time (computed from cruise speed
 *     and great-circle distance). No ground / turnaround time — the aircraft
 *     instantly U-turns at each terminus to keep the flight "always online".
 *   - Phase = (time + phaseOffset × cycle) modulo cycle.
 *   - First half = outbound, second half = inbound.
 */
export function computeSimulatedPosition(
  flight: SimulatedFlight,
  now: Date = new Date()
): SimulatedPosition {
  const distKm = greatCircleDistanceKm(flight.origin, flight.destination);
  const cruiseKmh = flight.cruiseSpeedKt * KNOT_TO_KMH;
  const onewayMs = (distKm / cruiseKmh) * 3600 * 1000;
  const cycleMs = onewayMs * 2;

  const t = now.getTime();
  const offset = flight.phaseOffset * cycleMs;
  const phase = (((t + offset) % cycleMs) + cycleMs) % cycleMs;
  const isOutbound = phase < onewayMs;
  const legProgress = isOutbound
    ? phase / onewayMs
    : (phase - onewayMs) / onewayMs;

  const legFrom = isOutbound ? flight.origin : flight.destination;
  const legTo = isOutbound ? flight.destination : flight.origin;

  const here = greatCircleIntermediate(legFrom, legTo, legProgress);
  /* Bearing is from the current point toward the destination so the icon
     rotates correctly. */
  const nextPoint = greatCircleIntermediate(
    legFrom,
    legTo,
    Math.min(1, legProgress + 0.0005)
  );
  const trackDeg = initialBearingDeg(here, nextPoint);

  return {
    flight,
    lat: here.lat,
    lon: here.lon,
    trackDeg,
    baroAltitudeM: flight.cruiseAltitudeFt * 0.3048,
    velocityMs: (flight.cruiseSpeedKt * 1852) / 3600,
    legFrom,
    legTo,
    legProgress,
    legDirection: isOutbound ? "outbound" : "inbound",
    cycleMs,
  };
}

/** Vectorised helper — current position for every configured demo flight. */
export function getAllSimulatedPositions(now: Date = new Date()) {
  return SIMULATED_FLIGHTS.map((f) => computeSimulatedPosition(f, now));
}
