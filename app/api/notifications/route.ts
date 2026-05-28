import { NextResponse } from "next/server";
import { getLaunchTrackers, getNetworkSnapshot } from "@/lib/data/api";

export const dynamic = "force-dynamic";

/**
 * Notifications feed for the topbar bell. Derived deterministically from
 * the current network snapshot + launch trackers — no fake "you have new
 * messages" noise. Each alert links back to the actual drilldown so the
 * notification IS the action.
 */

type AlertTone = "critical" | "watch" | "info";

interface Alert {
  /** Stable id so the client can persist per-alert read state. */
  id: string;
  tone: AlertTone;
  title: string;
  body: string;
  href: string;
  /** Compact right-hand metric chip (optional). */
  metric?: string;
  /** ISO timestamp — used for the "n minutes ago" footer. */
  timestamp: string;
}

const TONE_RANK: Record<AlertTone, number> = {
  critical: 0,
  watch: 1,
  info: 2,
};

export async function GET() {
  const snapshot = getNetworkSnapshot();
  const launches = getLaunchTrackers();
  const now = new Date();
  const stamp = (offsetMin: number) =>
    new Date(now.getTime() - offsetMin * 60_000).toISOString();

  const alerts: Alert[] = [];

  /* 1. Critical stations — top by composite risk. */
  const critical = [...snapshot]
    .filter((b) => b.current.status === "critical")
    .sort((a, b) => b.current.riskScore - a.current.riskScore)
    .slice(0, 3);
  critical.forEach((b, i) =>
    alerts.push({
      id: `crit-${b.station.icao}`,
      tone: "critical",
      title: `${b.station.city} · ${b.station.icao} critical`,
      body: `Composite risk ${b.current.riskScore}. Top driver: ${b.current.topRisk}.`,
      href: `/stations/${b.station.icao}`,
      metric: `risk ${b.current.riskScore}`,
      timestamp: stamp(i * 3 + 2),
    })
  );

  /* 2. Vendor SLA cluster (≥4 breaches/7d at any station). */
  const vendorHotspots = [...snapshot]
    .filter((b) => b.current.vendorBreaches7d >= 4)
    .sort((a, b) => b.current.vendorBreaches7d - a.current.vendorBreaches7d)
    .slice(0, 2);
  vendorHotspots.forEach((b, i) =>
    alerts.push({
      id: `vend-${b.station.icao}`,
      tone: "critical",
      title: `Vendor SLA cluster — ${b.station.city}`,
      body: `${b.current.vendorBreaches7d} breaches in the last 7 days. Procurement review recommended.`,
      href: `/vendors`,
      metric: `${b.current.vendorBreaches7d} breaches`,
      timestamp: stamp(i * 4 + 8),
    })
  );

  /* 3. Open safety items above tolerance. */
  const safety = [...snapshot]
    .filter((b) => b.current.openIncidents >= 2)
    .sort((a, b) => b.current.openIncidents - a.current.openIncidents)
    .slice(0, 2);
  safety.forEach((b, i) =>
    alerts.push({
      id: `safety-${b.station.icao}`,
      tone: "watch",
      title: `${b.station.city} — ${b.current.openIncidents} open safety items`,
      body: `Quality / safety queue exceeds threshold. Standdown with regional HSE recommended.`,
      href: `/stations/${b.station.icao}`,
      metric: `${b.current.openIncidents} open`,
      timestamp: stamp(i * 5 + 15),
    })
  );

  /* 4. Launch trackers with overdue workstreams. */
  const launchSlip = launches
    .map((l) => ({
      l,
      overdue: l.workstreams.filter((w) => w.overdueDays > 0).length,
    }))
    .filter((x) => x.overdue > 0)
    .sort((a, b) => b.overdue - a.overdue)
    .slice(0, 2);
  launchSlip.forEach(({ l, overdue }, i) =>
    alerts.push({
      id: `launch-${l.icao}`,
      tone: "watch",
      title: `Launch slipping — ${l.stationName}`,
      body: `${overdue} workstream${overdue === 1 ? "" : "s"} overdue · T-${l.daysToGoLive}d to go-live · readiness ${l.readinessScore}%.`,
      href: `/launches`,
      metric: `${l.readinessScore}% ready`,
      timestamp: stamp(i * 6 + 22),
    })
  );

  /* 5. Slot compliance dip. Informational — surfaces softer trend signals. */
  const slotDip = [...snapshot]
    .filter(
      (b) => b.current.slotCompliance < 0.85 && b.current.turnsLast24h >= 3
    )
    .sort((a, b) => a.current.slotCompliance - b.current.slotCompliance)
    .slice(0, 1);
  slotDip.forEach((b, i) =>
    alerts.push({
      id: `slot-${b.station.icao}`,
      tone: "info",
      title: `On-time slipping at ${b.station.city}`,
      body: `Slot compliance ${Math.round(b.current.slotCompliance * 100)}% vs 90% target. Review tower sequencing.`,
      href: `/stations/${b.station.icao}`,
      metric: `${Math.round(b.current.slotCompliance * 100)}% slot`,
      timestamp: stamp(i * 7 + 40),
    })
  );

  /* Sort by severity then by recency (already encoded in stamp offset). */
  alerts.sort((a, b) => {
    const t = TONE_RANK[a.tone] - TONE_RANK[b.tone];
    if (t !== 0) return t;
    return a.timestamp < b.timestamp ? 1 : -1;
  });

  return NextResponse.json({
    generatedAt: now.toISOString(),
    alerts: alerts.slice(0, 8),
  });
}
