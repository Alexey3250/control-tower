import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { Topbar } from "@/components/shell/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/components/kpi/status-pill";
import { RiskRadar } from "@/components/station/risk-radar";
import { StationTrendChart } from "@/components/station/trend-chart";
import { getStationBundle } from "@/lib/data/api";
import { getAviationWeather } from "@/lib/data/noaa";
import { formatNumber, formatPercent } from "@/lib/utils";
import { Skeleton, LiveDataPulse } from "@/components/ui/skeleton";

export default async function StationPage({
  params,
}: {
  params: Promise<{ icao: string }>;
}) {
  const { icao } = await params;
  const bundle = getStationBundle(icao);
  if (!bundle) notFound();
  const { station, current, trend } = bundle;

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title={`${station.city} · ${station.icao}`}
        subtitle={`${station.name} · ${station.country} · ${station.region}`}
        meta={<StatusPill status={current.status} />}
      />

      <div className="flex-1 p-4 md:p-6 space-y-5 md:space-y-6">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft className="h-3.5 w-3.5" /> Network overview
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="font-mono">
              <MapPin className="h-3 w-3 mr-1" />
              {station.lat.toFixed(2)}, {station.lon.toFixed(2)}
            </Badge>
            <Badge variant="outline">{station.tier}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card>
            <CardHeader>
              <CardTitle>Composite risk</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4">
                <div className="font-display text-6xl text-jx-text leading-none">
                  {current.riskScore}
                </div>
                <div className="text-sm text-jx-muted pb-2">/100</div>
              </div>
              <div className="text-xs text-jx-muted mt-2">
                Top contributor:{" "}
                <span className="text-jx-gold">{current.topRisk}</span>
              </div>
              <div className="mt-4">
                <RiskRadar kpis={current} />
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Activity trend · 14d</CardTitle>
            </CardHeader>
            <CardContent>
              <StationTrendChart data={trend} />
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Metric label="Turns · 24h" value={formatNumber(current.turnsLast24h)} />
          <Metric label="PAX · 24h" value={formatNumber(current.paxLast24h)} />
          <Metric
            label="Avg turnaround"
            value={`${current.avgTurnaroundMin} min`}
          />
          <Metric
            label="Slot compliance"
            value={formatPercent(current.slotCompliance, 1)}
          />
          <Metric
            label="Ramp efficiency"
            value={formatPercent(current.rampEfficiency, 1)}
          />
          <Metric
            label="Manpower coverage"
            value={formatPercent(current.manpowerCoverage, 0)}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* NOAA live weather can stall — stream it in. The rest of the
              station page is already interactive while this resolves. */}
          <Suspense fallback={<WeatherFallback />}>
            <LiveWeatherCard
              icao={station.icao}
              fallbackMetar={bundle.metar}
              fallbackTaf={bundle.taf}
              fallback={bundle.weather}
            />
          </Suspense>

          <Card>
            <CardHeader>
              <CardTitle>Open issues</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Issue
                label="Vendor SLA breaches (7d)"
                value={current.vendorBreaches7d}
                threshold={3}
              />
              <Issue
                label="Open safety / quality"
                value={current.openIncidents}
                threshold={1}
              />
              <Issue
                label="Cost variance (MTD)"
                value={current.costVariancePct}
                threshold={5}
                suffix="%"
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Suggested action</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-jx-text leading-relaxed">
              {actionSentence(current.topRisk, station.city, current)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function LiveWeatherCard({
  icao,
  fallbackMetar,
  fallbackTaf,
  fallback,
}: {
  icao: string;
  fallbackMetar?: string;
  fallbackTaf?: string;
  fallback?: {
    windKt: number;
    gustKt: number;
    visM: number;
    ceilingFt: number;
    tempC: number;
    condition: string;
  };
}) {
  const liveWeather = await getAviationWeather(icao);
  const displayMetar = liveWeather.metar ?? fallbackMetar ?? "METAR unavailable";
  const displayTaf = liveWeather.taf ?? fallbackTaf ?? "TAF unavailable";
  const displayWind = liveWeather.windKt ?? fallback?.windKt;
  const displayGust = liveWeather.gustKt ?? fallback?.gustKt;
  const displayTemp = liveWeather.tempC ?? fallback?.tempC;
  const displayCondition = liveWeather.condition ?? fallback?.condition;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live weather</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge
            variant={liveWeather.source === "NOAA" ? "gold" : "secondary"}
          >
            {liveWeather.source === "NOAA" ? "NOAA live" : "fallback"}
          </Badge>
          {liveWeather.observedAt ? (
            <span className="text-xs text-jx-muted">
              observed {liveWeather.observedAt}
            </span>
          ) : null}
        </div>
        <div className="font-mono text-sm text-jx-text">{displayMetar}</div>
        <div className="font-mono text-xs text-jx-muted">{displayTaf}</div>
        {displayWind !== undefined ||
        displayGust !== undefined ||
        displayTemp !== undefined ? (
          <div className="grid grid-cols-3 gap-3 pt-3">
            <Metric
              label="Wind"
              value={displayWind !== undefined ? `${displayWind}kt` : "—"}
            />
            <Metric
              label="Gust"
              value={displayGust !== undefined ? `${displayGust}kt` : "—"}
            />
            <Metric
              label="Temp"
              value={displayTemp !== undefined ? `${displayTemp}°C` : "—"}
            />
          </div>
        ) : null}
        {displayCondition ? (
          <div className="text-xs text-jx-muted">
            Condition: <span className="font-mono">{displayCondition}</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function WeatherFallback() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Live weather</CardTitle>
        <LiveDataPulse label="Streaming NOAA" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="grid grid-cols-3 gap-3 pt-3">
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
          <Skeleton className="h-12" />
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-jx-border bg-jx-card px-3 py-2.5">
      <div className="text-[10px] uppercase tracking-wider text-jx-muted">
        {label}
      </div>
      <div className="font-mono text-jx-text text-lg mt-0.5">{value}</div>
    </div>
  );
}

function Issue({
  label,
  value,
  threshold,
  suffix,
}: {
  label: string;
  value: number;
  threshold: number;
  suffix?: string;
}) {
  const tone =
    value >= threshold * 1.5
      ? "critical"
      : value >= threshold
        ? "watch"
        : "healthy";
  return (
    <div className="flex items-center justify-between text-sm py-2 border-b border-jx-border/60 last:border-0">
      <span className="text-jx-muted">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono text-jx-text">
          {typeof value === "number" && !Number.isInteger(value)
            ? value.toFixed(1)
            : value}
          {suffix ?? ""}
        </span>
        <Badge variant={tone}>{tone}</Badge>
      </div>
    </div>
  );
}

function actionSentence(topRisk: string, city: string, k: {
  vendorBreaches7d: number;
  manpowerCoverage: number;
  openIncidents: number;
  costVariancePct: number;
}): string {
  switch (topRisk) {
    case "Vendor SLA":
      return `${city} is being held back by vendor performance — ${k.vendorBreaches7d} SLA breaches in 7 days. Trigger remediation with the lead procurement partner and revisit penalty clauses.`;
    case "Manpower coverage":
      return `${city} is short-staffed (${Math.round(
        k.manpowerCoverage * 100
      )}% coverage). Bring in cross-trained dispatchers from a sister station and re-balance the next 14-day roster.`;
    case "Safety incidents":
      return `${city} has ${k.openIncidents} open safety/quality items. Recommend a station standdown with regional HSE and root-cause review before next surge.`;
    case "Cost variance":
      return `${city} is running ${k.costVariancePct.toFixed(1)}% over budget. Audit overtime and vendor invoices for the period; lock spend approvals above $25k.`;
    case "Weather risk":
      return `${city} is exposed to elevated weather risk. Pre-position de-ice / hot-weather stores and rehearse diversion plans before next operational window.`;
    default:
      return `${city} demand is running hot. Confirm next-shift dispatch coverage and tactical fuel reserves.`;
  }
}
