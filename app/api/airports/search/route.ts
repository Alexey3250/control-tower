import { NextResponse } from "next/server";
import { searchAirports } from "@/lib/data/ourairports";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = url.searchParams.get("q") ?? "";
  const limit = Number(url.searchParams.get("limit") ?? 12);
  const results = await searchAirports(q, Number.isFinite(limit) ? limit : 12);
  return NextResponse.json({ results });
}
