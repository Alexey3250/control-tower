import "server-only";
import { cache } from "react";
import {
  FLEET,
  type FleetAircraft,
  type FleetLayer,
  type FleetUiStatus,
} from "@/config/fleet";
import {
  SIMULATED_FLIGHTS,
  computeSimulatedPosition,
} from "@/lib/sim/routes";

const OPENSKY_BASE = "https://opensky-network.org/api";

export type FleetStatus = "flying" | "parked" | "offline";

export interface AircraftState {
  icao24: string;
  callsign: string | null;
  originCountry: string;
  lon: number | null;
  lat: number | null;
  baroAltitudeM: number | null;
  onGround: boolean;
  velocityMs: number | null;
  trackDeg: number | null;
  verticalRateMs: number | null;
  lastContact: number;
  /** When OpenSky has no record for this aircraft in its open feed. */
  status: FleetStatus;
  // Static metadata copied from FLEET for convenience
  tail: string;
  typeCode: string;
  model: string;
  jetexRelationship: string;
  broadcastOperator?: string;
  homeBaseHint?: string;
  layer: FleetLayer;
  confidence: FleetAircraft["confidence"];
  uiStatus: FleetUiStatus;
  note?: string;
}

export interface AircraftFlight {
  icao24: string;
  firstSeen: number;
  estDepartureAirport: string | null;
  lastSeen: number;
  estArrivalAirport: string | null;
  callsign: string | null;
  estDepartureAirportHorizDistance: number | null;
  estDepartureAirportVertDistance: number | null;
  estArrivalAirportHorizDistance: number | null;
  estArrivalAirportVertDistance: number | null;
  departureAirportCandidatesCount: number;
  arrivalAirportCandidatesCount: number;
}

/** Parse a single OpenSky state vector tuple. */
function parseStateVector(
  s: unknown[]
): {
  icao24: string;
  callsign: string | null;
  originCountry: string;
  lon: number | null;
  lat: number | null;
  baroAltitudeM: number | null;
  onGround: boolean;
  velocityMs: number | null;
  trackDeg: number | null;
  verticalRateMs: number | null;
  lastContact: number;
} | null {
  if (!Array.isArray(s) || s.length < 12) return null;
  return {
    icao24: String(s[0]).toLowerCase(),
    callsign: typeof s[1] === "string" ? s[1].trim() || null : null,
    originCountry: String(s[2] ?? ""),
    lon: typeof s[5] === "number" ? (s[5] as number) : null,
    lat: typeof s[6] === "number" ? (s[6] as number) : null,
    baroAltitudeM: typeof s[7] === "number" ? (s[7] as number) : null,
    onGround: Boolean(s[8]),
    velocityMs: typeof s[9] === "number" ? (s[9] as number) : null,
    trackDeg: typeof s[10] === "number" ? (s[10] as number) : null,
    verticalRateMs: typeof s[11] === "number" ? (s[11] as number) : null,
    lastContact: typeof s[4] === "number" ? (s[4] as number) : 0,
  };
}

function authHeader(): HeadersInit | undefined {
  const u = process.env.OPENSKY_USER;
  const p = process.env.OPENSKY_PASS;
  if (!u || !p) return undefined;
  const token = Buffer.from(`${u}:${p}`).toString("base64");
  return { Authorization: `Basic ${token}` };
}

/**
 * Fetch live state vectors for the configured FLEET. Always returns ONE
 * `AircraftState` per fleet aircraft — including those OpenSky has no live
 * data for (those come back as `status: "offline"`). The UI uses this to
 * render flying / parked / offline aircraft consistently.
 */
export const getFleetStates = cache(async (): Promise<AircraftState[]> => {
  if (FLEET.length === 0) return [];

  const params = new URLSearchParams();
  FLEET.forEach((a) => params.append("icao24", a.icao24.toLowerCase()));

  let live: Record<string, ReturnType<typeof parseStateVector>> = {};
  try {
    /* Short timeout — OpenSky regularly stalls for >10s on anonymous
       requests. If it's slow, return empty live state and let the UI
       fall back to "offline" rather than hanging the whole page. */
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 6_000);
    const res = await fetch(`${OPENSKY_BASE}/states/all?${params.toString()}`, {
      headers: authHeader(),
      signal: ctrl.signal,
      next: { revalidate: 15, tags: ["opensky-states"] },
    }).finally(() => clearTimeout(timer));
    if (res.ok) {
      const json = (await res.json()) as { states: unknown[][] | null };
      for (const row of json.states ?? []) {
        const parsed = parseStateVector(row);
        if (parsed) live[parsed.icao24] = parsed;
      }
    } else {
      console.warn(`[opensky] states/all ${res.status}`);
    }
  } catch (err) {
    console.warn("[opensky] fetch failed", err);
    live = {};
  }

  const realStates: AircraftState[] = FLEET.map((aircraft) => {
    const s = live[aircraft.icao24.toLowerCase()];
    const status: FleetStatus = !s
      ? "offline"
      : s.onGround || (s.velocityMs !== null && s.velocityMs < 30)
        ? "parked"
        : "flying";

    return {
      icao24: aircraft.icao24,
      callsign: s?.callsign ?? null,
      originCountry: s?.originCountry ?? "",
      lon: s?.lon ?? null,
      lat: s?.lat ?? null,
      baroAltitudeM: s?.baroAltitudeM ?? null,
      onGround: s?.onGround ?? true,
      velocityMs: s?.velocityMs ?? null,
      trackDeg: s?.trackDeg ?? null,
      verticalRateMs: s?.verticalRateMs ?? null,
      lastContact: s?.lastContact ?? 0,
      status,
      tail: aircraft.tail,
      typeCode: aircraft.typeCode,
      model: aircraft.model,
      jetexRelationship: aircraft.jetexRelationship,
      broadcastOperator: aircraft.broadcastOperator,
      homeBaseHint: aircraft.homeBaseHint,
      layer: aircraft.layer,
      confidence: aircraft.confidence,
      uiStatus: aircraft.uiStatus,
      note: aircraft.note,
    };
  });

  /*
   * Append the always-on simulated demo flights. These are deterministically
   * computed from `Date.now()` so the position is stable across SSR/CSR
   * boundaries and obeys the same `AircraftState` contract as real OpenSky
   * data. They are clearly flagged with `layer: "simulated"` and
   * `uiStatus: "simulated"` for the UI to render with a distinct treatment.
   */
  const now = new Date();
  const simStates: AircraftState[] = SIMULATED_FLIGHTS.map((flight) => {
    const pos = computeSimulatedPosition(flight, now);
    return {
      icao24: flight.icao24,
      callsign: flight.callsign,
      originCountry: "Simulated",
      lon: pos.lon,
      lat: pos.lat,
      baroAltitudeM: pos.baroAltitudeM,
      onGround: false,
      velocityMs: pos.velocityMs,
      trackDeg: pos.trackDeg,
      verticalRateMs: 0,
      lastContact: Math.floor(now.getTime() / 1000),
      status: "flying",
      tail: flight.tail,
      typeCode: flight.typeCode,
      model: flight.model,
      jetexRelationship: flight.jetexRelationship,
      broadcastOperator: `Simulated · ${pos.legFrom.iata} → ${pos.legTo.iata}`,
      homeBaseHint: "Dubai (DWC)",
      layer: "simulated",
      confidence: "high",
      uiStatus: "simulated",
      note: `Synthetic demo: ${flight.origin.iata} ↔ ${flight.destination.iata} round-trip, deterministically interpolated.`,
    };
  });

  return [...realStates, ...simStates];
});

export function getFleetAircraft(icao24: string): FleetAircraft | undefined {
  return FLEET.find((a) => a.icao24.toLowerCase() === icao24.toLowerCase());
}

export function getFleetRoster(): FleetAircraft[] {
  return FLEET;
}

export async function getAircraftFlights(
  icao24: string,
  sinceHours = 168
): Promise<AircraftFlight[]> {
  const end = Math.floor(Date.now() / 1000);
  const begin = end - sinceHours * 60 * 60;
  const params = new URLSearchParams({
    icao24: icao24.toLowerCase(),
    begin: String(begin),
    end: String(end),
  });

  try {
    const res = await fetch(
      `${OPENSKY_BASE}/flights/aircraft?${params.toString()}`,
      {
        headers: authHeader(),
        next: { revalidate: 300, tags: [`opensky-flights-${icao24}`] },
      }
    );
    if (!res.ok) {
      console.warn(`[opensky] flights/aircraft ${icao24} ${res.status}`);
      return [];
    }
    const json = (await res.json()) as unknown[];
    return json
      .filter((row): row is Record<string, unknown> => row !== null)
      .map((row) => ({
        icao24: String(row.icao24 ?? icao24).toLowerCase(),
        firstSeen: Number(row.firstSeen ?? 0),
        estDepartureAirport:
          typeof row.estDepartureAirport === "string"
            ? row.estDepartureAirport
            : null,
        lastSeen: Number(row.lastSeen ?? 0),
        estArrivalAirport:
          typeof row.estArrivalAirport === "string"
            ? row.estArrivalAirport
            : null,
        callsign:
          typeof row.callsign === "string" ? row.callsign.trim() || null : null,
        estDepartureAirportHorizDistance:
          typeof row.estDepartureAirportHorizDistance === "number"
            ? row.estDepartureAirportHorizDistance
            : null,
        estDepartureAirportVertDistance:
          typeof row.estDepartureAirportVertDistance === "number"
            ? row.estDepartureAirportVertDistance
            : null,
        estArrivalAirportHorizDistance:
          typeof row.estArrivalAirportHorizDistance === "number"
            ? row.estArrivalAirportHorizDistance
            : null,
        estArrivalAirportVertDistance:
          typeof row.estArrivalAirportVertDistance === "number"
            ? row.estArrivalAirportVertDistance
            : null,
        departureAirportCandidatesCount: Number(
          row.departureAirportCandidatesCount ?? 0
        ),
        arrivalAirportCandidatesCount: Number(
          row.arrivalAirportCandidatesCount ?? 0
        ),
      }))
      .sort((a, b) => b.lastSeen - a.lastSeen);
  } catch (err) {
    console.warn(`[opensky] flights fetch failed ${icao24}`, err);
    return [];
  }
}
