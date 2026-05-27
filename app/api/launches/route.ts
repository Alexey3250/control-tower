import { NextResponse } from "next/server";
import { getLaunchTrackers } from "@/lib/data/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const launches = getLaunchTrackers();
  const rows = launches.flatMap((l) =>
    l.workstreams.map((w) => ({
      ICAO: l.icao,
      Station: l.stationName,
      City: l.city,
      Region: l.region,
      "Go-Live": l.goLiveDate,
      "Readiness %": l.readinessScore,
      Workstream: w.label,
      Owner: w.owner,
      Start: w.start,
      End: w.end,
      "Progress %": Math.round(w.progress * 100),
      Status: w.status,
      "Overdue Days": w.overdueDays,
    }))
  );
  return NextResponse.json({ rows });
}
