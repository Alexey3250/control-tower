import "server-only";
import {
  buildLaunchTrackers,
  buildNetworkSnapshot,
  buildVendors,
} from "@/lib/mock/seed";
import { STATIONS } from "@/config/network";
import type { LaunchTracker, StationKpiBundle, VendorScore } from "@/lib/types";

/**
 * Server-only data access layer. Today these resolve from a deterministic
 * faker seed so the demo is reproducible. The interface is shaped so we can
 * later swap in: OpenSky for live traffic, NOAA Aviation Weather for
 * METAR/TAF, Open-Meteo for historical climate, and an internal store for
 * ops data — without touching screen code.
 */

let cachedNetwork: StationKpiBundle[] | null = null;
let cachedLaunches: LaunchTracker[] | null = null;
let cachedVendors: VendorScore[] | null = null;

export function getNetworkSnapshot(): StationKpiBundle[] {
  if (!cachedNetwork) cachedNetwork = buildNetworkSnapshot();
  return cachedNetwork;
}

export function getStationBundle(icao: string): StationKpiBundle | undefined {
  return getNetworkSnapshot().find(
    (b) => b.station.icao.toUpperCase() === icao.toUpperCase()
  );
}

export function getLaunchTrackers(): LaunchTracker[] {
  if (!cachedLaunches) cachedLaunches = buildLaunchTrackers();
  return cachedLaunches;
}

export function getVendors(): VendorScore[] {
  if (!cachedVendors) cachedVendors = buildVendors();
  return cachedVendors;
}

export function getStations() {
  return STATIONS;
}

export interface NetworkAggregate {
  totalStations: number;
  totalTurns: number;
  totalPax: number;
  totalFuelGal: number;
  /** Volume-weighted average turnaround time, minutes. Jetex's brand metric. */
  avgTurnaroundMin: number;
  /** On-time arrival / departure rate 0..1 (a.k.a. slot compliance). */
  avgSlotCompliance: number;
  /** Ramp utilisation 0..1 — kept for drilldown / advanced views. */
  avgRampEfficiency: number;
  /** Crew availability across the network, 0..1. */
  avgManpowerCoverage: number;
  /** Vendor SLA compliance, 0..1. Derived from `vendorBreaches7d` capped at 6. */
  vendorSlaComplianceRate: number;
  /** Combined watch + critical destination count — "needs attention". */
  stationsAtRisk: number;
  stationsCritical: number;
  stationsWatch: number;
  stationsHealthy: number;
  totalVendorBreaches: number;
  totalOpenIncidents: number;
}

export function getNetworkAggregate(): NetworkAggregate {
  const net = getNetworkSnapshot();
  const totalTurns = net.reduce((s, b) => s + b.current.turnsLast24h, 0);
  const totalPax = net.reduce((s, b) => s + b.current.paxLast24h, 0);
  const totalFuel = net.reduce((s, b) => s + b.current.fuelGalLast24h, 0);
  /* Volume-weighted (heavier hubs dominate). Falls back to simple average
     when totalTurns is zero so the KPI never NaNs. */
  const weightedTurnaround =
    totalTurns > 0
      ? net.reduce(
          (s, b) => s + b.current.avgTurnaroundMin * b.current.turnsLast24h,
          0
        ) / totalTurns
      : net.reduce((s, b) => s + b.current.avgTurnaroundMin, 0) / net.length;
  const avgSlot =
    net.reduce((s, b) => s + b.current.slotCompliance, 0) / net.length;
  const avgRamp =
    net.reduce((s, b) => s + b.current.rampEfficiency, 0) / net.length;
  const avgManpower =
    net.reduce((s, b) => s + b.current.manpowerCoverage, 0) / net.length;
  const totalBreaches = net.reduce(
    (s, b) => s + b.current.vendorBreaches7d,
    0
  );
  /* Compliance = 1 - normalised breach load. Capped against the same `5`
     ceiling used in seed.ts so it stays in a believable 60–100% range. */
  const vendorSla = Math.max(
    0,
    1 - totalBreaches / Math.max(1, net.length * 3)
  );
  const stationsCritical = net.filter(
    (b) => b.current.status === "critical"
  ).length;
  const stationsWatch = net.filter((b) => b.current.status === "watch").length;

  return {
    totalStations: net.length,
    totalTurns,
    totalPax,
    totalFuelGal: totalFuel,
    avgTurnaroundMin: Math.round(weightedTurnaround),
    avgSlotCompliance: Number(avgSlot.toFixed(3)),
    avgRampEfficiency: Number(avgRamp.toFixed(3)),
    avgManpowerCoverage: Number(avgManpower.toFixed(3)),
    vendorSlaComplianceRate: Number(vendorSla.toFixed(3)),
    stationsAtRisk: stationsCritical + stationsWatch,
    stationsCritical,
    stationsWatch,
    stationsHealthy: net.filter((b) => b.current.status === "healthy").length,
    totalVendorBreaches: totalBreaches,
    totalOpenIncidents: net.reduce((s, b) => s + b.current.openIncidents, 0),
  };
}
