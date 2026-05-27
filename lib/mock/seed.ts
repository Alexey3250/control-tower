import { faker } from "@faker-js/faker";
import { STATIONS } from "@/config/network";
import { RISK_BUCKETS, RISK_WEIGHTS } from "@/config/risk-weights";
import type {
  KpiTrendPoint,
  LaunchTracker,
  Station,
  StationKpiBundle,
  StationKpis,
  StationStatus,
  VendorScore,
  Workstream,
} from "@/lib/types";

faker.seed(20260527);

function clamp01(v: number) {
  return Math.max(0, Math.min(1, v));
}

/**
 * Realistic per-station BizAv daily movement capacity for the Jetex network.
 *
 * Calibration reference: Jetex publicly reports handling ~20,000 flights per
 * year network-wide (≈55 per day across the global footprint). With this
 * tiering and 48 destinations, total network turns settle around 150–200/day
 * — believable for an FBO network, not airline volumes.
 *
 *   Ultra-VIP (DXB / DWC / LBG / BQH / KOPF):  ~12–23 turns/day
 *   VIP       (CDG / MAD / FCO / GRU / HND…):  ~4–9  turns/day
 *   Standard  (regional Spanish/French fields):~1–2  turns/day
 */
function tierCapacity(tier: Station["tier"]) {
  switch (tier) {
    case "Ultra-VIP":
      return 22;
    case "VIP":
      return 8;
    default:
      return 2;
  }
}

function statusFromScore(score: number): StationStatus {
  if (score < RISK_BUCKETS.healthy) return "healthy";
  if (score < RISK_BUCKETS.watch) return "watch";
  return "critical";
}

function topRiskFrom(components: Record<string, number>): string {
  const [label] = Object.entries(components).sort((a, b) => b[1] - a[1])[0];
  return label;
}

function generateKpis(station: Station): StationKpis {
  const capacity = tierCapacity(station.tier);
  const seedBias = (station.icao.charCodeAt(0) + station.icao.charCodeAt(3)) % 7;
  const trafficPressureRaw = clamp01(
    0.45 + (seedBias - 3) * 0.06 + faker.number.float({ min: -0.12, max: 0.18 })
  );
  /* Min 1 movement/day so even Standard regional fields show on the board.
     PAX-per-turn calibrated to typical BizAv occupancy (light/mid/heavy jets
     seat 4–14 PAX; ~3–7 average matches public Jetex marketing). */
  const turns = Math.max(1, Math.round(capacity * (0.55 + trafficPressureRaw * 0.5)));
  const pax = turns * faker.number.int({ min: 3, max: 7 });
  const fuel = turns * faker.number.int({ min: 850, max: 2400 });
  const slot = clamp01(0.94 - trafficPressureRaw * 0.18 + faker.number.float({ min: -0.04, max: 0.04 }));
  const ramp = clamp01(0.55 + trafficPressureRaw * 0.35 + faker.number.float({ min: -0.05, max: 0.05 }));
  const manpower = clamp01(0.95 - faker.number.float({ min: 0, max: 0.32 }));
  const vendorBreaches = faker.number.int({ min: 0, max: 5 });
  const incidents = faker.number.int({ min: 0, max: 3 });
  const costVariance = faker.number.float({ min: -6, max: 14 });
  const weatherRisk = clamp01(faker.number.float({ min: 0.05, max: 0.7 }));

  const components = {
    trafficPressure: trafficPressureRaw,
    weatherRisk,
    manpowerCoverage: 1 - manpower,
    vendorSlaBreach: clamp01(vendorBreaches / 5),
    safetyIncidents: clamp01(incidents / 3),
    costVariance: clamp01(Math.max(0, costVariance) / 14),
  };

  const w = RISK_WEIGHTS;
  const composite =
    components.trafficPressure * w.trafficPressure +
    components.weatherRisk * w.weatherRisk +
    components.manpowerCoverage * w.manpowerCoverage +
    components.vendorSlaBreach * w.vendorSlaBreach +
    components.safetyIncidents * w.safetyIncidents +
    components.costVariance * w.costVariance;
  const riskScore = Math.round(composite * 100);

  const topRiskLabel = topRiskFrom(components);
  const labelMap: Record<string, string> = {
    trafficPressure: "Traffic pressure",
    weatherRisk: "Weather risk",
    manpowerCoverage: "Manpower coverage",
    vendorSlaBreach: "Vendor SLA",
    safetyIncidents: "Safety incidents",
    costVariance: "Cost variance",
  };

  return {
    icao: station.icao,
    turnsLast24h: turns,
    avgTurnaroundMin: Math.round(38 + trafficPressureRaw * 24 + (1 - manpower) * 18),
    slotCompliance: Number(slot.toFixed(3)),
    rampEfficiency: Number(ramp.toFixed(3)),
    paxLast24h: pax,
    fuelGalLast24h: fuel,
    manpowerCoverage: Number(manpower.toFixed(3)),
    vendorBreaches7d: vendorBreaches,
    openIncidents: incidents,
    costVariancePct: Number(costVariance.toFixed(2)),
    status: statusFromScore(riskScore),
    riskScore,
    topRisk: labelMap[topRiskLabel] ?? "Unknown",
  };
}

function generateTrend(base: StationKpis): KpiTrendPoint[] {
  const days = 14;
  const out: KpiTrendPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const noise = faker.number.float({ min: -0.18, max: 0.18 });
    out.push({
      day: d.toISOString().slice(0, 10),
      turns: Math.max(1, Math.round(base.turnsLast24h * (1 + noise))),
      pax: Math.max(1, Math.round(base.paxLast24h * (1 + noise))),
      compliance: clamp01(base.slotCompliance + faker.number.float({ min: -0.05, max: 0.04 })),
    });
  }
  return out;
}

function generateWeather(station: Station) {
  const windKt = faker.number.int({ min: 3, max: 28 });
  const gustKt = windKt + faker.number.int({ min: 0, max: 12 });
  const visM = faker.helpers.arrayElement([1500, 3000, 6000, 9999, 9999, 9999]);
  const ceilingFt = faker.helpers.arrayElement([800, 1500, 3000, 8000, 30000, 30000]);
  const tempC = faker.number.int({ min: -5, max: 42 });
  const condition = faker.helpers.arrayElement([
    "CLR",
    "FEW020",
    "SCT040",
    "BKN030",
    "OVC015",
    "TS",
    "BR",
  ]);
  const metar = `${station.icao} ${faker.date.recent().getUTCHours().toString().padStart(2, "0")}${faker.date.recent().getUTCMinutes().toString().padStart(2, "0")}Z ${String(faker.number.int({ min: 0, max: 360 })).padStart(3, "0")}${String(windKt).padStart(2, "0")}KT ${visM === 9999 ? "9999" : visM} ${condition} ${tempC}/${tempC - 6} Q1015`;
  return {
    metar,
    taf: `${station.icao} TAF ${condition} VRB${windKt}KT`,
    weather: {
      windKt,
      gustKt,
      visM,
      ceilingFt,
      tempC,
      condition,
    },
  };
}

export function buildNetworkSnapshot(): StationKpiBundle[] {
  faker.seed(20260527);
  return STATIONS.map((station) => {
    const current = generateKpis(station);
    const trend = generateTrend(current);
    const wx = generateWeather(station);
    return {
      station,
      current,
      trend,
      ...wx,
    };
  });
}

const WORKSTREAM_DEFS: Array<{
  key: Workstream["key"];
  label: string;
  weight: number;
  durationDays: number;
}> = [
  { key: "permits", label: "Permits & Licensing", weight: 0.18, durationDays: 90 },
  { key: "staffing", label: "Staffing & Recruitment", weight: 0.14, durationDays: 75 },
  { key: "equipment", label: "Equipment Procurement", weight: 0.16, durationDays: 60 },
  { key: "it", label: "IT & Systems", weight: 0.10, durationDays: 45 },
  { key: "training", label: "Training", weight: 0.10, durationDays: 40 },
  { key: "trial-ops", label: "Trial Operations", weight: 0.12, durationDays: 21 },
  { key: "regulatory", label: "Regulatory Sign-off", weight: 0.10, durationDays: 30 },
  { key: "go-live", label: "Go-Live Readiness", weight: 0.10, durationDays: 14 },
];

const LAUNCH_PIPELINE: Array<{
  icao: string;
  name: string;
  city: string;
  region: Station["region"];
  daysToGoLive: number;
}> = [
  { icao: "EGGW", name: "London Luton", city: "London", region: "Europe", daysToGoLive: 42 },
  { icao: "LSGG", name: "Geneva Cointrin", city: "Geneva", region: "Europe", daysToGoLive: 95 },
  { icao: "OEJN", name: "Jeddah King Abdulaziz", city: "Jeddah", region: "Middle East", daysToGoLive: 18 },
  { icao: "VABB", name: "Mumbai Chhatrapati Shivaji", city: "Mumbai", region: "Asia Pacific", daysToGoLive: 128 },
  { icao: "KTEB", name: "Teterboro", city: "New York", region: "Americas", daysToGoLive: 61 },
];

export function buildLaunchTrackers(): LaunchTracker[] {
  faker.seed(20260601);
  return LAUNCH_PIPELINE.map((p) => {
    const goLive = new Date();
    goLive.setDate(goLive.getDate() + p.daysToGoLive);

    const workstreams: Workstream[] = WORKSTREAM_DEFS.map((def, i) => {
      const start = new Date(goLive);
      start.setDate(start.getDate() - 180 + i * 15);
      const end = new Date(start);
      end.setDate(end.getDate() + def.durationDays);

      const today = new Date();
      const planExpectedProgress = clamp01(
        (today.getTime() - start.getTime()) /
          Math.max(1, end.getTime() - start.getTime())
      );

      const drift = faker.number.float({ min: -0.25, max: 0.1 });
      const progress = clamp01(planExpectedProgress + drift);

      const overdueDays =
        today > end && progress < 1
          ? Math.round((today.getTime() - end.getTime()) / 86400000)
          : 0;

      let status: Workstream["status"] = "green";
      if (overdueDays > 0) status = "red";
      else if (progress < planExpectedProgress - 0.12) status = "amber";
      else if (planExpectedProgress > 0 && progress < planExpectedProgress - 0.05) status = "amber";

      return {
        key: def.key,
        label: def.label,
        weight: def.weight,
        start: start.toISOString().slice(0, 10),
        end: end.toISOString().slice(0, 10),
        progress: Number(progress.toFixed(2)),
        status,
        owner: faker.person.fullName(),
        overdueDays,
      };
    });

    const readiness =
      workstreams.reduce((acc, w) => acc + w.progress * w.weight, 0) * 100;

    return {
      icao: p.icao,
      stationName: p.name,
      city: p.city,
      region: p.region,
      goLiveDate: goLive.toISOString().slice(0, 10),
      daysToGoLive: p.daysToGoLive,
      readinessScore: Math.round(readiness),
      workstreams,
    };
  });
}

const VENDOR_CATEGORIES = [
  "Fueling",
  "Catering",
  "Ground Handling",
  "Cleaning",
  "Security",
  "Ground Transport",
  "Permits",
] as const;

const VENDOR_NAMES = [
  "Falcon Fuelers",
  "Silver Service Catering",
  "Apex Ground Services",
  "Pristine Cabin Care",
  "Sentinel Aviation Security",
  "BlackTie Chauffeurs",
  "Skyline Permits Bureau",
  "Pioneer Petroleum",
  "Royal Galley",
  "Aero Handling Co.",
  "Crystal Clean Aviation",
  "Vanguard Protective",
  "Prestige Cars",
  "Worldwide Permit Desk",
  "Emirates Jet Fuel",
  "OmanAir Catering",
  "GHA Handling",
  "Diamond Detail",
  "Iron Watch Security",
  "Lux Transfers",
];

export function buildVendors(): VendorScore[] {
  faker.seed(20260615);
  return VENDOR_NAMES.map((name, i) => {
    const category = VENDOR_CATEGORIES[i % VENDOR_CATEGORIES.length];
    const region = faker.helpers.arrayElement([
      "Middle East",
      "Europe",
      "Asia Pacific",
      "Africa",
      "Americas",
    ] as const);

    const onTime = Math.round(faker.number.int({ min: 62, max: 99 }));
    const quality = Math.round(faker.number.int({ min: 60, max: 98 }));
    const costCompliance = Math.round(faker.number.int({ min: 55, max: 99 }));
    const incidentRate = Math.round(faker.number.int({ min: 50, max: 99 }));
    const overall = Math.round(
      (onTime + quality + costCompliance + incidentRate) / 4
    );

    const trend12w = Array.from({ length: 12 }).map((_, w) => {
      const base = overall + faker.number.int({ min: -10, max: 8 });
      return Math.max(40, Math.min(100, base - (11 - w) * 0.3));
    });

    return {
      vendorId: `V-${String(i + 1).padStart(3, "0")}`,
      vendor: name,
      category,
      region,
      onTime,
      quality,
      costCompliance,
      incidentRate,
      overall,
      trend12w,
      slaBreaches: faker.number.int({ min: 0, max: 6 }),
      contractValueUsd: faker.number.int({ min: 150_000, max: 4_200_000 }),
    };
  });
}
