import "server-only";
import { STATIONS } from "@/config/network";
import { getWeatherProfile } from "@/lib/data/open-meteo";
import type {
  FeasibilityInputs,
  FeasibilityResult,
} from "@/lib/types";

interface Coordinate {
  lat: number;
  lon: number;
}

function haversineNm(a: Coordinate, b: Coordinate) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 3440.065;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const REGION_REGULATORY: Record<string, number> = {
  "Middle East": 0.78,
  Europe: 0.82,
  "Asia Pacific": 0.7,
  Africa: 0.55,
  Americas: 0.74,
};

const FBO_TIER_SETUP_USD: Record<FeasibilityInputs["fboTier"], number> = {
  Compact: 2_400_000,
  Standard: 5_800_000,
  Flagship: 12_500_000,
};

const STAFFING_BASE: Record<FeasibilityInputs["staffingModel"], { multiplier: number; perTurn: number }> = {
  Lean: { multiplier: 0.8, perTurn: 0.18 },
  Standard: { multiplier: 1.0, perTurn: 0.22 },
  Premium: { multiplier: 1.35, perTurn: 0.28 },
};

const SERVICE_REVENUE_PER_TURN: Record<FeasibilityInputs["serviceTier"], number> = {
  Standard: 1_800,
  VIP: 3_400,
  "Ultra-VIP": 5_900,
};

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

export async function runFeasibility(
  inputs: FeasibilityInputs,
  candidate: Coordinate & { region?: FeasibilityInputs["region"] }
): Promise<FeasibilityResult> {
  const weather = await getWeatherProfile(candidate.lat, candidate.lon);

  // Demand fit: market size relative to FBO tier capacity
  const tierCapacityMovements: Record<FeasibilityInputs["fboTier"], number> = {
    Compact: 220,
    Standard: 600,
    Flagship: 1400,
  };
  const tierCap = tierCapacityMovements[inputs.fboTier];
  const utilisation = inputs.expectedMovementsMonth / tierCap;
  // Sweet spot is around 70-85% utilisation
  const demandFit = clamp01(
    1 - Math.min(Math.abs(utilisation - 0.78) / 0.78, 1)
  );

  // Network synergy: distance to nearest 3 existing Jetex stations (closer is
  // marginally better — supports repositioning and crew rotation; very close
  // could cannibalise so we cap)
  const distances = STATIONS.map((s) =>
    haversineNm({ lat: s.lat, lon: s.lon }, candidate)
  ).sort((a, b) => a - b);
  const avgTop3 = (distances[0] + distances[1] + distances[2]) / 3;
  const networkSynergy = clamp01(
    avgTop3 < 200 ? 0.6 : avgTop3 < 800 ? 1.0 : avgTop3 < 1800 ? 0.85 : 0.55
  );

  // Regulatory ease by region
  const regulatoryEase = REGION_REGULATORY[inputs.region] ?? 0.7;

  // Cost efficiency: based on vendor cost index and rent
  const rentBenchmark = 220_000;
  const rentScore = clamp01(1 - (inputs.rentMonthlyUsd - rentBenchmark) / 600_000);
  const vendorScore = clamp01(1 - (inputs.vendorCostIndex - 0.6) / 1.4);
  const costEfficiency = (rentScore + vendorScore) / 2;

  const weatherTolerability = weather.tolerability;

  // Weighted composite
  const subScores = {
    demandFit,
    weatherTolerability,
    costEfficiency,
    regulatoryEase,
    networkSynergy,
  };
  const weights = {
    demandFit: 0.3,
    weatherTolerability: 0.15,
    costEfficiency: 0.25,
    regulatoryEase: 0.15,
    networkSynergy: 0.15,
  };
  const composite =
    Object.entries(subScores).reduce(
      (acc, [k, v]) => acc + v * (weights as Record<string, number>)[k],
      0
    ) * 100;
  const compositeScore = Math.round(composite);

  let verdict: FeasibilityResult["verdict"];
  if (compositeScore >= 70) verdict = "Go";
  else if (compositeScore >= 50) verdict = "Watch";
  else verdict = "No-Go";

  // Financial model
  const setup = FBO_TIER_SETUP_USD[inputs.fboTier];
  const staff = STAFFING_BASE[inputs.staffingModel];
  const headcountTotal = Math.round(
    inputs.expectedMovementsMonth * staff.perTurn * staff.multiplier + 12
  );
  const avgSalary = inputs.region === "Middle East" || inputs.region === "Europe" ? 5_400 : 3_900;
  const payrollMonthly = headcountTotal * avgSalary;

  const vendorMonthly = inputs.expectedMovementsMonth * 540 * inputs.vendorCostIndex;
  const utilitiesMonthly = inputs.expectedMovementsMonth * 95 + 18_000;
  const opex =
    inputs.rentMonthlyUsd + payrollMonthly + vendorMonthly + utilitiesMonthly;

  const serviceRevenue =
    inputs.expectedMovementsMonth * SERVICE_REVENUE_PER_TURN[inputs.serviceTier];
  const fuelGalPerMovement = 1_400;
  const fuelRevenue =
    inputs.expectedMovementsMonth * fuelGalPerMovement * inputs.fuelMarginUsdGal;
  const monthlyRevenue = serviceRevenue + fuelRevenue;
  const monthlyEbitda = monthlyRevenue - opex;

  const breakevenMonths =
    monthlyEbitda > 0 ? Math.ceil(setup / monthlyEbitda) : Infinity;
  const costPerTurn = opex / Math.max(inputs.expectedMovementsMonth, 1);

  // 3-year NPV at 10% with monthly traffic growth applied
  const monthlyGrowth = Math.pow(1 + inputs.trafficGrowthPct / 100, 1 / 12) - 1;
  let npv = -setup;
  let cur = monthlyEbitda;
  const discount = Math.pow(1 + 0.1, 1 / 12) - 1;
  for (let m = 1; m <= 36; m++) {
    npv += cur / Math.pow(1 + discount, m);
    cur *= 1 + monthlyGrowth;
  }

  const headcountByRole = [
    { role: "Ramp Agents", count: Math.round(headcountTotal * 0.35) },
    { role: "Customer Service", count: Math.round(headcountTotal * 0.18) },
    { role: "Fuelers", count: Math.round(headcountTotal * 0.12) },
    { role: "Dispatch / Ops", count: Math.round(headcountTotal * 0.12) },
    { role: "Security", count: Math.round(headcountTotal * 0.08) },
    { role: "Management", count: Math.round(headcountTotal * 0.08) },
    { role: "Maintenance & Cleaning", count: Math.round(headcountTotal * 0.07) },
  ];

  const waterfall = [
    { label: "Service revenue", value: Math.round(serviceRevenue) },
    { label: "Fuel margin", value: Math.round(fuelRevenue) },
    { label: "Payroll", value: -Math.round(payrollMonthly) },
    { label: "Vendors", value: -Math.round(vendorMonthly) },
    { label: "Rent", value: -inputs.rentMonthlyUsd },
    { label: "Utilities", value: -Math.round(utilitiesMonthly) },
    { label: "EBITDA", value: Math.round(monthlyEbitda) },
  ];

  // Rationale: top contributors and biggest drags
  const ranked = Object.entries(subScores).sort((a, b) => b[1] - a[1]);
  const labelMap: Record<string, string> = {
    demandFit: "Demand fit",
    weatherTolerability: "Weather tolerability",
    costEfficiency: "Cost efficiency",
    regulatoryEase: "Regulatory ease",
    networkSynergy: "Network synergy",
  };
  const rationale = [
    `Strong on ${labelMap[ranked[0][0]]} (${Math.round(ranked[0][1] * 100)}/100).`,
    `Supported by ${labelMap[ranked[1][0]]} (${Math.round(ranked[1][1] * 100)}/100).`,
    `Weakest area: ${labelMap[ranked[ranked.length - 1][0]]} (${Math.round(
      ranked[ranked.length - 1][1] * 100
    )}/100).`,
  ];

  const conditions: string[] = [];
  if (verdict === "Watch" || verdict === "No-Go") {
    if (subScores.demandFit < 0.6)
      conditions.push("Re-validate traffic projections — current capacity / demand mismatch.");
    if (subScores.costEfficiency < 0.6)
      conditions.push("Renegotiate rent or vendor mix to bring cost index below 1.0.");
    if (subScores.weatherTolerability < 0.55)
      conditions.push(
        "Plan for weather-driven downtime: bigger de-ice/AC budget, robust diversion SOPs."
      );
    if (subScores.regulatoryEase < 0.6)
      conditions.push("Engage local CAA early — assume +90d permitting buffer.");
    if (subScores.networkSynergy < 0.6)
      conditions.push("Identify partner FBO for crew/equipment rotation to offset isolation.");
    if (utilisation > 1)
      conditions.push("Step up to next FBO tier — projected demand exceeds capacity.");
  }

  return {
    inputs,
    verdict,
    compositeScore,
    subScores,
    rationale,
    conditions,
    financial: {
      setupCostUsd: setup,
      monthlyOpexUsd: Math.round(opex),
      monthlyRevenueUsd: Math.round(monthlyRevenue),
      monthlyEbitdaUsd: Math.round(monthlyEbitda),
      breakevenMonths:
        breakevenMonths === Infinity ? -1 : breakevenMonths,
      threeYearNpvUsd: Math.round(npv),
      headcountTotal,
      headcountByRole,
      costPerTurnUsd: Math.round(costPerTurn),
      waterfall,
    },
  };
}
