import { RISK_BUCKETS, RISK_WEIGHTS } from "@/config/risk-weights";
import type { StationKpiBundle, StationStatus } from "@/lib/types";

export type RiskWeightKey = keyof typeof RISK_WEIGHTS;
export type RiskWeights = Record<RiskWeightKey, number>;

export const RISK_LABELS: Record<RiskWeightKey, string> = {
  trafficPressure: "Traffic pressure",
  weatherRisk: "Weather risk",
  manpowerCoverage: "Manpower coverage",
  vendorSlaBreach: "Vendor SLA",
  safetyIncidents: "Safety incidents",
  costVariance: "Cost variance",
};

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

function tierCapacity(tier: StationKpiBundle["station"]["tier"]) {
  if (tier === "Ultra-VIP") return 80;
  if (tier === "VIP") return 50;
  return 30;
}

export function statusFromScore(score: number): StationStatus {
  if (score < RISK_BUCKETS.healthy) return "healthy";
  if (score < RISK_BUCKETS.watch) return "watch";
  return "critical";
}

export function riskComponents(bundle: StationKpiBundle): RiskWeights {
  const { current, station, weather } = bundle;
  const weatherRisk = weather
    ? clamp01(
        (weather.windKt / 35 +
          weather.gustKt / 50 +
          (weather.visM < 5000 ? 0.25 : 0) +
          (weather.ceilingFt < 1500 ? 0.25 : 0)) /
          2
      )
    : 1 - current.slotCompliance;

  return {
    trafficPressure: clamp01(current.turnsLast24h / tierCapacity(station.tier)),
    weatherRisk,
    manpowerCoverage: 1 - current.manpowerCoverage,
    vendorSlaBreach: clamp01(current.vendorBreaches7d / 5),
    safetyIncidents: clamp01(current.openIncidents / 3),
    costVariance: clamp01(Math.max(0, current.costVariancePct) / 14),
  };
}

export function scoreStationRisk(
  bundle: StationKpiBundle,
  weights: RiskWeights = RISK_WEIGHTS
) {
  const components = riskComponents(bundle);
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  const weighted =
    (Object.keys(weights) as RiskWeightKey[]).reduce(
      (sum, key) => sum + components[key] * weights[key],
      0
    ) / totalWeight;
  const score = Math.round(weighted * 100);
  const topKey = (Object.keys(weights) as RiskWeightKey[]).sort(
    (a, b) => components[b] * weights[b] - components[a] * weights[a]
  )[0];

  return {
    score,
    status: statusFromScore(score),
    topRisk: RISK_LABELS[topKey],
    topKey,
    components,
  };
}

export function rankStationsByRisk(
  snapshot: StationKpiBundle[],
  weights: RiskWeights = RISK_WEIGHTS
) {
  return snapshot
    .map((bundle) => ({
      ...bundle,
      computedRisk: scoreStationRisk(bundle, weights),
    }))
    .sort((a, b) => b.computedRisk.score - a.computedRisk.score);
}
