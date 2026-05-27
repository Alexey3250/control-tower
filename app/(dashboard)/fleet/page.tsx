import { Plane, Radio, ShieldQuestion, ParkingSquare, Layers } from "lucide-react";
import { Topbar } from "@/components/shell/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FleetTable } from "@/components/fleet/fleet-table";
import { getFleetStates } from "@/lib/data/opensky";
import { FLEET_LAYERS } from "@/config/fleet";

export const dynamic = "force-dynamic";

export default async function FleetPage() {
  const aircraft = await getFleetStates();
  const flying = aircraft.filter((a) => a.status === "flying").length;
  const parked = aircraft.filter((a) => a.status === "parked").length;
  const offline = aircraft.filter((a) => a.status === "offline").length;

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Fleet Intelligence"
        subtitle={`${aircraft.length} tracked aircraft · ${flying} flying · ${parked} parked · ${offline} offline`}
        meta={<Badge variant="outline">OpenSky live state</Badge>}
      />

      <div className="flex-1 p-4 md:p-6 space-y-5 md:space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <FleetStat
            label="Tracked aircraft"
            value={aircraft.length}
            icon={<Plane className="h-4 w-4" />}
          />
          <FleetStat
            label="Flying now"
            value={flying}
            tone="healthy"
            icon={<Radio className="h-4 w-4" />}
          />
          <FleetStat
            label="Parked / ground"
            value={parked}
            tone="gold"
            icon={<ParkingSquare className="h-4 w-4" />}
          />
          <FleetStat
            label="Offline"
            value={offline}
            tone="muted"
            icon={<ShieldQuestion className="h-4 w-4" />}
          />
        </div>

        <Card>
          <CardContent className="p-4 md:p-5 space-y-3">
            <div className="flex items-center gap-2 text-xs text-jx-muted">
              <Layers className="h-3.5 w-3.5 text-jx-orange" />
              Fleet sourced from JetVIP charter listings, Jetex LLC fleet
              directories, and the JetVIP DWC airport page — each row carries a
              confidence rating and a separate <em>broadcast operator</em> when
              public trackers label it differently.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
              {FLEET_LAYERS.map((l) => (
                <div
                  key={l.id}
                  className="rounded-md border border-jx-border bg-jx-panel px-3 py-2"
                >
                  <div className="text-jx-orange-deep text-[10px] uppercase tracking-wider">
                    {l.label}
                  </div>
                  <div className="text-jx-muted mt-0.5">{l.description}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-5">
            <FleetTable aircraft={aircraft} />
          </CardContent>
        </Card>

        <p className="text-xs text-jx-muted">
          Offline means OpenSky has no current open-feed state vector for that
          ICAO24. This is common for business aviation, and it does not prove
          the aircraft is inactive.
        </p>
      </div>
    </div>
  );
}

function FleetStat({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: number;
  tone?: "healthy" | "gold" | "muted";
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div
          className={
            tone === "healthy"
              ? "text-jx-healthy"
              : tone === "gold"
                ? "text-jx-gold"
                : "text-jx-muted"
          }
        >
          {icon}
        </div>
        <div className="mt-2 text-[10px] uppercase tracking-wider text-jx-muted">
          {label}
        </div>
        <div className="font-display text-3xl text-jx-text">{value}</div>
      </CardContent>
    </Card>
  );
}
