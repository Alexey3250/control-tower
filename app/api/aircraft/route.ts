import { NextResponse } from "next/server";
import { getFleetStates } from "@/lib/data/opensky";

export const dynamic = "force-dynamic";
export const revalidate = 10;

export async function GET() {
  const states = await getFleetStates();
  return NextResponse.json({ states, fetchedAt: new Date().toISOString() });
}
