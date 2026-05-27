import { Activity, AlertTriangle, Building2 } from "lucide-react";
import { Topbar } from "@/components/shell/topbar";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StationIndexTable } from "@/components/station/station-index-table";
import {
  getNetworkAggregate,
  getNetworkSnapshot,
} from "@/lib/data/api";

export default function StationsPage() {
  const snapshot = getNetworkSnapshot();
  const agg = getNetworkAggregate();

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Station Risk Score"
        subtitle="Sortable network-wide station risk table with live drilldowns"
        meta={
          <Badge variant="outline">{agg.totalStations} Jetex stations</Badge>
        }
      />

      <div className="flex-1 p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard
            label="Stations"
            value={agg.totalStations}
            icon={<Building2 className="h-4 w-4" />}
          />
          <SummaryCard
            label="Critical"
            value={agg.stationsCritical}
            tone="critical"
            icon={<AlertTriangle className="h-4 w-4" />}
          />
          <SummaryCard
            label="Watch"
            value={agg.stationsWatch}
            tone="watch"
            icon={<Activity className="h-4 w-4" />}
          />
          <SummaryCard
            label="Healthy"
            value={agg.stationsHealthy}
            tone="healthy"
            icon={<Activity className="h-4 w-4" />}
          />
        </div>

        <Card>
          <CardContent className="p-5">
            <StationIndexTable snapshot={snapshot} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone?: "healthy" | "watch" | "critical";
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div
          className={
            tone === "healthy"
              ? "text-jx-healthy"
              : tone === "watch"
                ? "text-jx-watch"
                : tone === "critical"
                  ? "text-jx-critical"
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
