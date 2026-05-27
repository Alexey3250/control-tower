import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  ClipboardCheck,
  Clock,
  Globe2,
  Info,
  MapPin,
  Plane,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
} from "lucide-react";
import { Topbar } from "@/components/shell/topbar";
import { KpiCard } from "@/components/kpi/kpi-card";
import { StatusPill } from "@/components/kpi/status-pill";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getNetworkAggregate,
  getNetworkSnapshot,
} from "@/lib/data/api";
import { REGIONS } from "@/config/network";
import { formatNumber, formatPercent } from "@/lib/utils";
import { ExportOverviewButton } from "@/components/exports/export-overview";
import { NetworkRefreshTimer } from "@/components/shell/network-refresh-timer";
import { TrendStrip } from "@/components/kpi/trend-strip";
import { ActionCards } from "@/components/overview/action-cards";
import { RiskWeightSimulator } from "@/components/overview/risk-weight-simulator";
import type { StationKpiBundle, StationStatus } from "@/lib/types";
import Image from "next/image";
import { BUILDER } from "@/config/builder";
import { LinkedInIcon, WhatsAppIcon } from "@/components/shell/builder-icons";

/** Per-region rollup used by the region-snapshot strip. */
function regionRollup(snapshot: StationKpiBundle[]) {
  return REGIONS.map((region) => {
    const here = snapshot.filter((b) => b.station.region === region);
    if (here.length === 0) return null;
    const status = (s: StationStatus) =>
      here.filter((b) => b.current.status === s).length;
    const turns = here.reduce((s, b) => s + b.current.turnsLast24h, 0);
    const avgRisk = Math.round(
      here.reduce((s, b) => s + b.current.riskScore, 0) / here.length
    );
    const worst = [...here].sort(
      (a, b) => b.current.riskScore - a.current.riskScore
    )[0];
    return {
      region,
      stations: here.length,
      turns,
      avgRisk,
      healthy: status("healthy"),
      watch: status("watch"),
      critical: status("critical"),
      worst,
    };
  }).filter(Boolean) as Array<{
    region: string;
    stations: number;
    turns: number;
    avgRisk: number;
    healthy: number;
    watch: number;
    critical: number;
    worst: StationKpiBundle;
  }>;
}

function riskTone(score: number): string {
  if (score >= 70) return "var(--jx-status-critical)";
  if (score >= 45) return "var(--jx-status-watch)";
  return "var(--jx-status-healthy)";
}

export default function NetworkOverviewPage() {
  const agg = getNetworkAggregate();
  const snapshot = getNetworkSnapshot();

  const top = [...snapshot]
    .sort((a, b) => b.current.riskScore - a.current.riskScore)
    .slice(0, 6);

  const networkTrend = snapshot[0].trend.map((p, i) => ({
    day: p.day,
    value: snapshot.reduce((s, b) => s + b.trend[i].turns, 0),
  }));

  const regions = regionRollup(snapshot);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Network Overview"
        subtitle={`${agg.totalStations} Jetex destinations · ${formatNumber(agg.totalTurns)} turns in last 24h · ${formatNumber(agg.totalPax)} PAX`}
        meta={
          <Badge variant="outline" className="font-mono">
            FY26 · Q2
          </Badge>
        }
      />

      <div className="flex-1 p-4 md:p-6 space-y-5 md:space-y-6">
        {/*
          Portfolio + builder strip.
          On the LEFT: portrait + name + role pitch so the HR person sees who
          built this the moment the page loads. On the RIGHT: direct
          LinkedIn + WhatsApp buttons (branded colours so they're hard to
          miss), plus the project status badges.
        */}
        <section className="rounded-lg border border-jx-border bg-white px-4 md:px-5 py-3 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/about"
              className="shrink-0 group"
              title={`About ${BUILDER.name}`}
            >
              <Image
                src={BUILDER.photo}
                alt={BUILDER.name}
                width={44}
                height={44}
                className="h-11 w-11 rounded-full object-cover ring-2 ring-white shadow-sm group-hover:ring-jx-orange/40 transition"
              />
            </Link>
            <div className="leading-tight min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.22em] text-jx-orange font-semibold">
                  <Sparkles className="h-3 w-3" />
                  Portfolio · built by
                </span>
                <Link
                  href="/about"
                  className="text-sm font-semibold text-jx-text hover:text-jx-orange transition-colors"
                >
                  {BUILDER.name}
                </Link>
                <span className="text-[11px] text-jx-muted hidden md:inline">
                  · {BUILDER.tagline}
                </span>
              </div>
              <div className="text-[11px] text-jx-muted mt-0.5 flex items-center gap-1.5 flex-wrap">
                <span>
                  {agg.totalStations} Jetex destinations · {regions.length}{" "}
                  regions
                </span>
                <span className="hidden md:inline text-jx-subtle">·</span>
                <span className="hidden md:inline">
                  live OpenSky · synthetic ops KPIs
                </span>
                <Link
                  href="/about"
                  className="text-jx-orange hover:underline inline-flex items-center gap-0.5"
                >
                  <Info className="h-3 w-3" />
                  About
                </Link>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={BUILDER.links.linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-[#0a66c2] hover:bg-[#0856a8] text-white px-2.5 py-1.5 text-[11px] font-semibold transition-colors"
            >
              <LinkedInIcon size={11} /> LinkedIn
            </a>
            <a
              href={BUILDER.links.whatsappUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-md bg-[#25d366] hover:bg-[#1ebe5d] text-white px-2.5 py-1.5 text-[11px] font-semibold transition-colors"
              title={`Message ${BUILDER.name} on WhatsApp`}
            >
              <WhatsAppIcon size={11} /> WhatsApp
            </a>
            <span className="hidden md:inline-block w-px h-5 bg-jx-border mx-0.5" />
            <Badge variant="healthy">{agg.stationsHealthy} healthy</Badge>
            <Badge variant="watch">{agg.stationsWatch} watch</Badge>
            <Badge variant="critical">{agg.stationsCritical} critical</Badge>
          </div>
        </section>

        {/* Refresh + export row. Kept compact and right-aligned. */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <NetworkRefreshTimer />
          <ExportOverviewButton />
        </div>

        {/*
          KPI strip — six leading indicators an FBO ops director would scan
          first thing each morning. Calibrated to BizAv (Jetex is private
          aviation, not airline), so we lead with SERVICE-QUALITY metrics —
          turnaround speed, on-time, vendor SLA, stations at risk — instead
          of volume vanity metrics like total PAX or fuel uplift.
        */}
        <section className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
          <KpiCard
            label="Movements · 24h"
            value={formatNumber(agg.totalTurns)}
            hint="Network arrivals + departures"
            delta={2.3}
            icon={<Plane className="h-4 w-4" />}
          >
            <TrendStrip data={networkTrend} />
          </KpiCard>
          <KpiCard
            label="Avg Turnaround"
            value={`${agg.avgTurnaroundMin}m`}
            hint="Service speed · weighted by movements"
            delta={-1.8}
            intent={agg.avgTurnaroundMin < 55 ? "good" : "warn"}
            icon={<Clock className="h-4 w-4" />}
          />
          <KpiCard
            label="On-Time"
            value={formatPercent(agg.avgSlotCompliance, 1)}
            hint="Slot compliance · network avg"
            delta={-0.6}
            intent={agg.avgSlotCompliance > 0.9 ? "good" : "warn"}
            icon={<TrendingUp className="h-4 w-4" />}
          />
          <KpiCard
            label="Vendor SLA"
            value={formatPercent(agg.vendorSlaComplianceRate, 1)}
            hint={`${agg.totalVendorBreaches} breaches · last 7d`}
            delta={0.9}
            intent={
              agg.vendorSlaComplianceRate > 0.9
                ? "good"
                : agg.vendorSlaComplianceRate > 0.75
                  ? "warn"
                  : "bad"
            }
            icon={<ClipboardCheck className="h-4 w-4" />}
          />
          <KpiCard
            label="Crew Coverage"
            value={formatPercent(agg.avgManpowerCoverage, 1)}
            hint="Staffed vs required · network avg"
            delta={0.4}
            intent={agg.avgManpowerCoverage > 0.85 ? "good" : "warn"}
            icon={<Users className="h-4 w-4" />}
          />
          <KpiCard
            label="Stations at Risk"
            value={String(agg.stationsAtRisk)}
            hint={`${agg.stationsCritical} critical · ${agg.stationsWatch} watch · ${agg.totalOpenIncidents} open safety`}
            intent={
              agg.stationsCritical > 0
                ? "bad"
                : agg.stationsAtRisk > 0
                  ? "warn"
                  : "good"
            }
            icon={<ShieldAlert className="h-4 w-4" />}
          />
        </section>

        {/* Action cards — pushed up so the user sees the verbs first. */}
        <ActionCards snapshot={snapshot} />

        {/* Two-column band: Today's attention list (left) + Region snapshot (right). */}
        <section className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-4 md:gap-5">
          {/* LEFT — Top stations needing attention. Re-styled as a tight,
              skimmable list (not a wide BI table) so it fits in the column. */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <div>
                <CardTitle className="text-jx-text text-sm normal-case tracking-normal">
                  <AlertTriangle className="h-3.5 w-3.5 inline-block mr-1.5 -mt-0.5 text-jx-orange" />
                  Stations needing attention
                </CardTitle>
                <div className="text-[11px] text-jx-muted mt-0.5">
                  Sorted by composite risk · top 6 of {snapshot.length}
                </div>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/map">
                  Open map
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-jx-border">
                {top.map(({ station, current }, idx) => (
                  <li
                    key={station.icao}
                    className="px-4 md:px-5 py-3 hover:bg-jx-panel/60 transition-colors"
                  >
                    <Link
                      href={`/stations/${station.icao}`}
                      className="block group"
                    >
                      <div className="flex items-start gap-3">
                        {/* Rank chip */}
                        <span
                          className="shrink-0 h-7 w-7 rounded-full grid place-items-center text-[11px] font-bold font-mono"
                          style={{
                            background: riskTone(current.riskScore) + "22",
                            color: riskTone(current.riskScore),
                            border: `1px solid ${riskTone(current.riskScore)}55`,
                          }}
                        >
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-jx-text group-hover:text-jx-orange transition-colors">
                              {station.city}
                              {station.isHQ ? (
                                <span className="ml-1 text-[9px] text-jx-orange font-bold tracking-wider">
                                  HQ
                                </span>
                              ) : null}
                            </span>
                            <span className="text-[11px] font-mono text-jx-muted">
                              {station.icao} · {station.iata}
                            </span>
                            <StatusPill status={current.status} />
                          </div>
                          <div className="mt-1 text-[12px] text-jx-muted leading-snug">
                            {current.topRisk}
                          </div>
                          <div className="mt-1.5 grid grid-cols-3 sm:grid-cols-4 gap-x-3 gap-y-0.5 text-[11px]">
                            <KV
                              label="Turns"
                              value={String(current.turnsLast24h)}
                            />
                            <KV
                              label="Slot"
                              value={formatPercent(current.slotCompliance, 0)}
                            />
                            <KV
                              label="Ramp"
                              value={formatPercent(current.rampEfficiency, 0)}
                            />
                            <KV
                              label="Crew"
                              value={formatPercent(current.manpowerCoverage, 0)}
                            />
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <div
                            className="font-mono text-xl font-bold leading-none"
                            style={{ color: riskTone(current.riskScore) }}
                          >
                            {current.riskScore}
                          </div>
                          <div className="text-[9px] uppercase tracking-wider text-jx-subtle mt-1">
                            risk
                          </div>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* RIGHT — Regional snapshot. Five compact tiles, one per region,
              showing station count, daily turns, average risk and a
              status-bar of healthy/watch/critical mix. */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <div>
                <CardTitle className="text-jx-text text-sm normal-case tracking-normal">
                  <Globe2 className="h-3.5 w-3.5 inline-block mr-1.5 -mt-0.5 text-jx-orange" />
                  Region snapshot
                </CardTitle>
                <div className="text-[11px] text-jx-muted mt-0.5">
                  Rollup by FBO region
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-jx-border">
                {regions.map((r) => (
                  <li key={r.region} className="px-4 md:px-5 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="font-semibold text-jx-text text-[13px]">
                          {r.region}
                        </div>
                        <div className="text-[11px] text-jx-muted">
                          {r.stations} destinations ·{" "}
                          {formatNumber(r.turns)} turns
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className="font-mono text-base font-bold leading-none"
                          style={{ color: riskTone(r.avgRisk) }}
                        >
                          {r.avgRisk}
                        </div>
                        <div className="text-[9px] uppercase tracking-wider text-jx-subtle mt-0.5">
                          avg risk
                        </div>
                      </div>
                    </div>
                    {/* Healthy / watch / critical bar */}
                    <RegionMixBar
                      healthy={r.healthy}
                      watch={r.watch}
                      critical={r.critical}
                    />
                    <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-jx-muted">
                      <MapPin className="h-2.5 w-2.5" />
                      worst:&nbsp;
                      <Link
                        href={`/stations/${r.worst.station.icao}`}
                        className="text-jx-text hover:text-jx-orange"
                      >
                        {r.worst.station.city} ({r.worst.current.riskScore})
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Risk-weight simulator — moved to the bottom as an "advanced" panel. */}
        <RiskWeightSimulator snapshot={snapshot} />
      </div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1 min-w-0">
      <span className="text-jx-subtle uppercase tracking-wider text-[9px]">
        {label}
      </span>
      <span className="font-mono text-jx-text">{value}</span>
    </div>
  );
}

function RegionMixBar({
  healthy,
  watch,
  critical,
}: {
  healthy: number;
  watch: number;
  critical: number;
}) {
  const total = Math.max(1, healthy + watch + critical);
  return (
    <div className="mt-2 h-1.5 flex rounded-full overflow-hidden bg-jx-border/50">
      {healthy > 0 ? (
        <div
          style={{
            width: `${(healthy / total) * 100}%`,
            background: "var(--jx-status-healthy)",
          }}
          title={`${healthy} healthy`}
        />
      ) : null}
      {watch > 0 ? (
        <div
          style={{
            width: `${(watch / total) * 100}%`,
            background: "var(--jx-status-watch)",
          }}
          title={`${watch} watch`}
        />
      ) : null}
      {critical > 0 ? (
        <div
          style={{
            width: `${(critical / total) * 100}%`,
            background: "var(--jx-status-critical)",
          }}
          title={`${critical} critical`}
        />
      ) : null}
    </div>
  );
}
