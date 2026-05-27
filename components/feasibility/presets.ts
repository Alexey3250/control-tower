import type { FeasibilityInputs } from "@/lib/types";

export interface CandidateAirport {
  code: string;
  label: string;
  city: string;
  country: string;
  region: FeasibilityInputs["region"];
  lat: number;
  lon: number;
}

export const CANDIDATE_AIRPORTS: CandidateAirport[] = [
  { code: "EGGW", label: "London Luton (EGGW)", city: "London", country: "UK", region: "Europe", lat: 51.8747, lon: -0.3683 },
  { code: "LSGG", label: "Geneva (LSGG)", city: "Geneva", country: "Switzerland", region: "Europe", lat: 46.2381, lon: 6.1090 },
  { code: "KTEB", label: "Teterboro (KTEB)", city: "New York", country: "USA", region: "Americas", lat: 40.8501, lon: -74.0606 },
  { code: "OEJN", label: "Jeddah King Abdulaziz (OEJN)", city: "Jeddah", country: "Saudi Arabia", region: "Middle East", lat: 21.6796, lon: 39.1565 },
  { code: "VABB", label: "Mumbai (VABB)", city: "Mumbai", country: "India", region: "Asia Pacific", lat: 19.0887, lon: 72.8679 },
  { code: "OEDF", label: "Dammam King Fahd (OEDF)", city: "Dammam", country: "Saudi Arabia", region: "Middle East", lat: 26.4712, lon: 49.7980 },
  { code: "FAOR", label: "Johannesburg O.R. Tambo (FAOR)", city: "Johannesburg", country: "South Africa", region: "Africa", lat: -26.1392, lon: 28.2460 },
  { code: "VHHH", label: "Hong Kong (VHHH)", city: "Hong Kong", country: "China", region: "Asia Pacific", lat: 22.3080, lon: 113.9185 },
  { code: "LIRA", label: "Rome Ciampino (LIRA)", city: "Rome", country: "Italy", region: "Europe", lat: 41.7994, lon: 12.5949 },
];

export const DEFAULT_AIRPORT = CANDIDATE_AIRPORTS[0];

export const DEFAULT_INPUTS: FeasibilityInputs = {
  airportCode: "EGGW",
  city: "London",
  country: "UK",
  region: "Europe",
  expectedMovementsMonth: 480,
  fboTier: "Standard",
  staffingModel: "Standard",
  serviceTier: "VIP",
  fuelMarginUsdGal: 1.4,
  trafficGrowthPct: 8,
  rentMonthlyUsd: 280_000,
  vendorCostIndex: 1.0,
};
