import { NextResponse } from "next/server";
import { getNetworkSnapshot } from "@/lib/data/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const snapshot = getNetworkSnapshot();
  const rows = snapshot.map(({ station, current }) => ({
    ICAO: station.icao,
    IATA: station.iata ?? "",
    Station: station.name,
    City: station.city,
    Country: station.country,
    Region: station.region,
    Tier: station.tier,
    "Risk Score": current.riskScore,
    Status: current.status,
    "Top Risk": current.topRisk,
    "Turns 24h": current.turnsLast24h,
    "Avg Turnaround (min)": current.avgTurnaroundMin,
    "PAX 24h": current.paxLast24h,
    "Fuel Uplift (gal)": current.fuelGalLast24h,
    "Slot Compliance %": Math.round(current.slotCompliance * 100),
    "Ramp Efficiency %": Math.round(current.rampEfficiency * 100),
    "Manpower Coverage %": Math.round(current.manpowerCoverage * 100),
    "Vendor Breaches 7d": current.vendorBreaches7d,
    "Open Incidents": current.openIncidents,
    "Cost Variance %": current.costVariancePct,
  }));
  return NextResponse.json({ rows });
}
