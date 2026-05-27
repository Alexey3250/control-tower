import { NextResponse } from "next/server";
import { getNetworkSnapshot } from "@/lib/data/api";
import { rankStationsByRisk, type RiskWeights } from "@/lib/risk/score";
import { RISK_WEIGHTS } from "@/config/risk-weights";

export const dynamic = "force-dynamic";

function parseWeight(value: string | null, fallback: number) {
  const n = value === null ? NaN : Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const weights: RiskWeights = {
    trafficPressure: parseWeight(
      url.searchParams.get("trafficPressure"),
      RISK_WEIGHTS.trafficPressure
    ),
    weatherRisk: parseWeight(
      url.searchParams.get("weatherRisk"),
      RISK_WEIGHTS.weatherRisk
    ),
    manpowerCoverage: parseWeight(
      url.searchParams.get("manpowerCoverage"),
      RISK_WEIGHTS.manpowerCoverage
    ),
    vendorSlaBreach: parseWeight(
      url.searchParams.get("vendorSlaBreach"),
      RISK_WEIGHTS.vendorSlaBreach
    ),
    safetyIncidents: parseWeight(
      url.searchParams.get("safetyIncidents"),
      RISK_WEIGHTS.safetyIncidents
    ),
    costVariance: parseWeight(
      url.searchParams.get("costVariance"),
      RISK_WEIGHTS.costVariance
    ),
  };

  const ranked = rankStationsByRisk(getNetworkSnapshot(), weights).map((row) => ({
    icao: row.station.icao,
    iata: row.station.iata,
    city: row.station.city,
    country: row.station.country,
    region: row.station.region,
    status: row.computedRisk.status,
    score: row.computedRisk.score,
    topRisk: row.computedRisk.topRisk,
    components: row.computedRisk.components,
    turnsLast24h: row.current.turnsLast24h,
    slotCompliance: row.current.slotCompliance,
    rampEfficiency: row.current.rampEfficiency,
    manpowerCoverage: row.current.manpowerCoverage,
  }));

  return NextResponse.json({ weights, rows: ranked });
}
