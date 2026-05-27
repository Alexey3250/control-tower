export type Region =
  | "Middle East"
  | "Europe"
  | "Asia Pacific"
  | "Africa"
  | "Americas";

export type StationStatus = "healthy" | "watch" | "critical";

export type ServiceTier = "Standard" | "VIP" | "Ultra-VIP";

export interface Station {
  icao: string;
  iata?: string;
  name: string;
  city: string;
  country: string;
  region: Region;
  lat: number;
  lon: number;
  tier: ServiceTier;
  isHQ?: boolean;
}

export interface StationKpis {
  icao: string;
  /** Aircraft turns completed in last 24h */
  turnsLast24h: number;
  /** Average turnaround time in minutes */
  avgTurnaroundMin: number;
  /** Slot compliance rate 0-1 (on-time arrival/departure) */
  slotCompliance: number;
  /** Ramp efficiency 0-1 (utilization vs design capacity) */
  rampEfficiency: number;
  /** Passenger movements in last 24h */
  paxLast24h: number;
  /** Fuel uplift gallons last 24h */
  fuelGalLast24h: number;
  /** Manpower coverage 0-1 (staffed vs required) */
  manpowerCoverage: number;
  /** Open vendor SLA breaches in last 7 days */
  vendorBreaches7d: number;
  /** Open safety/quality incidents */
  openIncidents: number;
  /** Month-to-date cost variance vs budget (negative = under) */
  costVariancePct: number;
  status: StationStatus;
  /** Computed composite risk 0-100, lower is healthier */
  riskScore: number;
  /** Top risk contributor label */
  topRisk: string;
}

export interface KpiTrendPoint {
  day: string;
  turns: number;
  pax: number;
  compliance: number;
}

export interface StationKpiBundle {
  station: Station;
  current: StationKpis;
  trend: KpiTrendPoint[];
  metar?: string;
  taf?: string;
  weather?: {
    windKt: number;
    gustKt: number;
    visM: number;
    ceilingFt: number;
    tempC: number;
    condition: string;
  };
}

export type WorkstreamKey =
  | "permits"
  | "staffing"
  | "equipment"
  | "it"
  | "training"
  | "trial-ops"
  | "regulatory"
  | "go-live";

export interface Workstream {
  key: WorkstreamKey;
  label: string;
  weight: number;
  start: string;
  end: string;
  progress: number;
  status: "green" | "amber" | "red";
  owner: string;
  overdueDays: number;
}

export interface LaunchTracker {
  icao: string;
  stationName: string;
  city: string;
  region: Region;
  goLiveDate: string;
  daysToGoLive: number;
  readinessScore: number;
  workstreams: Workstream[];
}

export type VendorCategory =
  | "Fueling"
  | "Catering"
  | "Ground Handling"
  | "Cleaning"
  | "Security"
  | "Ground Transport"
  | "Permits";

export interface VendorScore {
  vendorId: string;
  vendor: string;
  category: VendorCategory;
  region: Region;
  /** 0-100 score per KPI */
  onTime: number;
  quality: number;
  costCompliance: number;
  incidentRate: number;
  overall: number;
  /** last 12-week trend (overall) */
  trend12w: number[];
  slaBreaches: number;
  contractValueUsd: number;
}

export interface FeasibilityInputs {
  airportCode: string;
  city: string;
  country: string;
  region: Region;
  expectedMovementsMonth: number;
  fboTier: "Compact" | "Standard" | "Flagship";
  staffingModel: "Lean" | "Standard" | "Premium";
  serviceTier: ServiceTier;
  fuelMarginUsdGal: number;
  trafficGrowthPct: number;
  rentMonthlyUsd: number;
  vendorCostIndex: number;
}

export interface FeasibilityResult {
  inputs: FeasibilityInputs;
  verdict: "Go" | "Watch" | "No-Go";
  compositeScore: number;
  subScores: {
    demandFit: number;
    weatherTolerability: number;
    costEfficiency: number;
    regulatoryEase: number;
    networkSynergy: number;
  };
  rationale: string[];
  conditions: string[];
  financial: {
    setupCostUsd: number;
    monthlyOpexUsd: number;
    monthlyRevenueUsd: number;
    monthlyEbitdaUsd: number;
    breakevenMonths: number;
    threeYearNpvUsd: number;
    headcountTotal: number;
    headcountByRole: { role: string; count: number }[];
    costPerTurnUsd: number;
    waterfall: { label: string; value: number }[];
  };
}

export type UserRole = "Network Director" | "Station Manager" | "Vendor Manager";
