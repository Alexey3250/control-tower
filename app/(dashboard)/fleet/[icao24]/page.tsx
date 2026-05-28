import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, MapPin, PlaneTakeoff } from "lucide-react";
import { Topbar } from "@/components/shell/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FlightHistoryChart } from "@/components/fleet/flight-history-chart";
import {
  getAircraftFlights,
  getFleetAircraft,
  getFleetStates,
  type AircraftFlight,
  type FleetStatus,
} from "@/lib/data/opensky";
import { FLEET_UI_STATUS_LABELS } from "@/config/fleet";
import { getStation } from "@/config/network";
import { mToFt, msToKt, nearestStation } from "@/lib/geo";
import { Skeleton, LiveDataPulse } from "@/components/ui/skeleton";

export const dynamic = "force-dynamic";

function statusVariant(status: FleetStatus) {
  if (status === "flying") return "healthy" as const;
  if (status === "parked") return "gold" as const;
  return "secondary" as const;
}

function fmtTime(unix: number) {
  if (!unix) return "—";
  return new Date(unix * 1000).toLocaleString();
}

function airportLabel(icao: string | null) {
  if (!icao) return "Unknown";
  const station = getStation(icao);
  return station ? `${icao} · ${station.city}` : icao;
}

export default async function FleetDetailPage({
  params,
}: {
  params: Promise<{ icao24: string }>;
}) {
  const { icao24 } = await params;
  const meta = getFleetAircraft(icao24);
  if (!meta) notFound();

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title={`${meta.tail} · ${meta.typeCode}`}
        subtitle={`${meta.model} · ${meta.jetexRelationship} · confidence ${meta.confidence.replace("_", "·")}`}
        meta={
          <Suspense fallback={<Badge variant="outline">Live state…</Badge>}>
            <LiveStatusBadge icao24={icao24} />
          </Suspense>
        }
      />

      <div className="flex-1 p-4 md:p-6 space-y-5 md:space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/fleet">
              <ArrowLeft className="h-3.5 w-3.5" />
              Fleet
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/map">
              <MapPin className="h-3.5 w-3.5" />
              Open operations map
            </Link>
          </Button>
        </div>

        {/* Static identity grid — renders instantly from the FLEET roster.
            ICAO24 is known synchronously; live position streams below. */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <Metric label="ICAO24" value={meta.icao24} />
          <Suspense fallback={<MetricSkeleton label="Current location" />}>
            <LivePositionMetric icao24={icao24} field="location" />
          </Suspense>
          <Suspense fallback={<MetricSkeleton label="Altitude" />}>
            <LivePositionMetric icao24={icao24} field="altitude" />
          </Suspense>
          <Suspense fallback={<MetricSkeleton label="Speed" />}>
            <LivePositionMetric icao24={icao24} field="speed" />
          </Suspense>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <Suspense
            fallback={<ChartFallback />}
          >
            <FlightHistorySection icao24={icao24} />
          </Suspense>
          <Suspense
            fallback={
              <Card>
                <CardHeader>
                  <CardTitle>Top airports</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-5 w-full" />
                  ))}
                </CardContent>
              </Card>
            }
          >
            <TopAirportsSection icao24={icao24} />
          </Suspense>
        </div>

        <Suspense
          fallback={
            <Card>
              <CardHeader>
                <CardTitle>Recent flight records</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="h-7 w-full" />
                ))}
              </CardContent>
            </Card>
          }
        >
          <RecentFlightsSection icao24={icao24} />
        </Suspense>

        <Card>
          <CardHeader>
            <CardTitle>Identity &amp; provenance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-jx-muted">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-jx-orange">
                  Jetex relationship
                </div>
                <div className="text-jx-text mt-0.5">{meta.jetexRelationship}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-jx-orange">
                  Broadcast operator (FR24)
                </div>
                <div className="text-jx-text mt-0.5">
                  {meta.broadcastOperator ?? "Not observed"}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-jx-orange">
                  Home base hint
                </div>
                <div className="text-jx-text mt-0.5">
                  {meta.homeBaseHint ?? "—"}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-jx-orange">
                  UI status
                </div>
                <div className="text-jx-text mt-0.5">
                  {FLEET_UI_STATUS_LABELS[meta.uiStatus].label}
                </div>
                <div className="text-[11px] text-jx-muted mt-0.5">
                  {FLEET_UI_STATUS_LABELS[meta.uiStatus].description}
                </div>
              </div>
            </div>
            {meta.note ? (
              <div className="rounded-md border border-jx-border bg-jx-panel px-3 py-2 text-xs">
                {meta.note}
              </div>
            ) : null}
            <p className="text-xs">
              OpenSky flight records are inferred from open ADS-B reception and
              may omit private, blocked, or weakly received segments. The
              dashboard intentionally separates the marketing <em>Jetex
              relationship</em> from the public <em>broadcast operator</em>,
              because they often disagree on charter-managed business jets.
            </p>
            <Button asChild variant="link" className="px-0">
              <a
                href={`https://opensky-network.org/aircraft-profile?icao24=${meta.icao24}`}
                target="_blank"
                rel="noreferrer"
              >
                OpenSky aircraft profile
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

/*
 * Streaming sections. Thanks to React.cache() in getFleetStates and
 * getAircraftFlights, multiple Suspense boundaries that reference the
 * same call dedupe into a single in-flight request — so the cost of
 * splitting the page like this is zero.
 */

async function LiveStatusBadge({ icao24 }: { icao24: string }) {
  const states = await getFleetStates();
  const state = states.find((a) => a.icao24 === icao24.toLowerCase());
  if (!state) return <Badge variant="secondary">offline</Badge>;
  return <Badge variant={statusVariant(state.status)}>{state.status}</Badge>;
}

async function LivePositionMetric({
  icao24,
  field,
}: {
  icao24: string;
  field: "location" | "altitude" | "speed";
}) {
  const states = await getFleetStates();
  const state = states.find((a) => a.icao24 === icao24.toLowerCase());

  if (field === "location") {
    const nearest =
      state?.lat !== null && state?.lon !== null && state
        ? nearestStation(state.lat, state.lon)
        : null;
    const value = nearest
      ? `${nearest.station.icao} · ${nearest.station.city}`
      : state?.lat !== null && state?.lon !== null && state
        ? `${state.lat.toFixed(2)}, ${state.lon.toFixed(2)}`
        : "No live OpenSky position";
    return <Metric label="Current location" value={value} />;
  }
  if (field === "altitude") {
    const value =
      state?.baroAltitudeM !== null && state?.baroAltitudeM !== undefined
        ? `${Math.round(mToFt(state.baroAltitudeM)).toLocaleString()} ft`
        : "—";
    return <Metric label="Altitude" value={value} />;
  }
  const value =
    state?.velocityMs !== null && state?.velocityMs !== undefined
      ? `${Math.round(msToKt(state.velocityMs))} kt`
      : "—";
  return <Metric label="Speed" value={value} />;
}

async function FlightHistorySection({ icao24 }: { icao24: string }) {
  const flights = await getAircraftFlights(icao24, 168);
  return (
    <Card className="xl:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Flights · last 7 days</CardTitle>
        <Badge variant="outline" className="font-mono">
          {flights.length} records
        </Badge>
      </CardHeader>
      <CardContent>
        <FlightHistoryChart flights={flights} />
      </CardContent>
    </Card>
  );
}

async function TopAirportsSection({ icao24 }: { icao24: string }) {
  const flights = await getAircraftFlights(icao24, 168);
  const topAirports = rankAirports(flights);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top airports</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {topAirports.length ? (
          topAirports.map((a) => (
            <div
              key={a.icao}
              className="flex items-center justify-between border-b border-jx-border/60 py-1.5 last:border-0"
            >
              <span className="font-mono text-jx-text">{a.icao}</span>
              <span className="text-xs text-jx-muted">{a.count} visits</span>
            </div>
          ))
        ) : (
          <div className="text-sm text-jx-muted">
            No airport candidates in OpenSky flight history.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

async function RecentFlightsSection({ icao24 }: { icao24: string }) {
  const flights = await getAircraftFlights(icao24, 168);
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Recent flight records</CardTitle>
        <LiveDataPulse label={`${flights.length} records`} />
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Departure</TableHead>
              <TableHead>Arrival</TableHead>
              <TableHead>Callsign</TableHead>
              <TableHead>First seen</TableHead>
              <TableHead>Last seen</TableHead>
              <TableHead className="text-right">Duration</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {flights.slice(0, 20).map((f) => (
              <TableRow key={`${f.firstSeen}-${f.lastSeen}`}>
                <TableCell>{airportLabel(f.estDepartureAirport)}</TableCell>
                <TableCell>{airportLabel(f.estArrivalAirport)}</TableCell>
                <TableCell className="font-mono">
                  {f.callsign ?? "—"}
                </TableCell>
                <TableCell className="text-xs text-jx-muted">
                  {fmtTime(f.firstSeen)}
                </TableCell>
                <TableCell className="text-xs text-jx-muted">
                  {fmtTime(f.lastSeen)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {duration(f)}
                </TableCell>
              </TableRow>
            ))}
            {flights.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-jx-muted py-8">
                  No OpenSky flight history returned for this ICAO24 in the
                  last 7 days.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-jx-muted">
          <PlaneTakeoff className="h-3 w-3" />
          {label}
        </div>
        <div className="mt-1 font-mono text-lg text-jx-text">{value}</div>
      </CardContent>
    </Card>
  );
}

function MetricSkeleton({ label }: { label: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-jx-muted">
          <PlaneTakeoff className="h-3 w-3" />
          {label}
        </div>
        <Skeleton className="mt-1.5 h-5 w-32" />
      </CardContent>
    </Card>
  );
}

function ChartFallback() {
  return (
    <Card className="xl:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Flights · last 7 days</CardTitle>
        <LiveDataPulse label="Streaming OpenSky" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-48 w-full" />
      </CardContent>
    </Card>
  );
}

function duration(f: AircraftFlight) {
  const minutes = Math.max(0, Math.round((f.lastSeen - f.firstSeen) / 60));
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

function rankAirports(flights: AircraftFlight[]) {
  const counts = new Map<string, number>();
  for (const f of flights) {
    for (const icao of [f.estDepartureAirport, f.estArrivalAirport]) {
      if (!icao) continue;
      counts.set(icao, (counts.get(icao) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .map(([icao, count]) => ({ icao, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);
}
