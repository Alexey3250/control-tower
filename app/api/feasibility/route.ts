import { NextResponse } from "next/server";
import { z } from "zod";
import { runFeasibility } from "@/lib/feasibility/engine";

export const dynamic = "force-dynamic";

const REGION = z.enum([
  "Middle East",
  "Europe",
  "Asia Pacific",
  "Africa",
  "Americas",
]);

const Schema = z.object({
  inputs: z.object({
    airportCode: z.string().min(3).max(8),
    city: z.string(),
    country: z.string(),
    region: REGION,
    expectedMovementsMonth: z.number().min(20).max(5000),
    fboTier: z.enum(["Compact", "Standard", "Flagship"]),
    staffingModel: z.enum(["Lean", "Standard", "Premium"]),
    serviceTier: z.enum(["Standard", "VIP", "Ultra-VIP"]),
    fuelMarginUsdGal: z.number().min(0).max(10),
    trafficGrowthPct: z.number().min(-20).max(50),
    rentMonthlyUsd: z.number().min(0).max(5_000_000),
    vendorCostIndex: z.number().min(0.4).max(2.5),
  }),
  candidate: z.object({
    lat: z.number(),
    lon: z.number(),
  }),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const result = await runFeasibility(parsed.data.inputs, {
    lat: parsed.data.candidate.lat,
    lon: parsed.data.candidate.lon,
    region: parsed.data.inputs.region,
  });
  return NextResponse.json(result);
}
