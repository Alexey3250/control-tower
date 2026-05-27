import { CalendarClock, MapPin } from "lucide-react";
import { Topbar } from "@/components/shell/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReadinessRing } from "@/components/launch/readiness-ring";
import { GanttBoard } from "@/components/launch/gantt-board";
import { getLaunchTrackers } from "@/lib/data/api";
import { ExportLaunchesButton } from "@/components/exports/export-launches";

export default function LaunchesPage() {
  const launches = getLaunchTrackers();
  const total = launches.length;
  const onTrack = launches.filter((l) => l.readinessScore >= 75).length;
  const watch = launches.filter(
    (l) => l.readinessScore >= 55 && l.readinessScore < 75
  ).length;
  const risk = launches.filter((l) => l.readinessScore < 55).length;

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="Station Launch Tracker"
        subtitle={`${total} stations in pipeline Â· ${onTrack} on track Â· ${risk} at risk`}
        meta={<Badge variant="outline">Operational readiness</Badge>}
      />

      <div className="flex-1 p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Badge variant="healthy">{onTrack} on track</Badge>
            <Badge variant="watch">{watch} watch</Badge>
            <Badge variant="critical">{risk} at risk</Badge>
          </div>
          <ExportLaunchesButton />
        </div>

        <div className="space-y-6">
          {launches.map((launch) => (
            <Card key={launch.icao}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-5">
                  <ReadinessRing value={launch.readinessScore} />
                  <div className="space-y-1">
                    <CardTitle className="text-sm">{launch.region}</CardTitle>
                    <div className="font-display text-2xl text-jx-text leading-tight">
                      {launch.stationName}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-jx-muted">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {launch.city}
                      </span>
                      <span className="font-mono">{launch.icao}</span>
                      <span className="flex items-center gap-1">
                        <CalendarClock className="h-3 w-3" />
                        Go-live{" "}
                        <span className="text-jx-text font-medium">
                          {launch.goLiveDate}
                        </span>{" "}
                        Â· T-{launch.daysToGoLive}d
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-2">
                      {launch.workstreams.some((w) => w.overdueDays > 0) ? (
                        <Badge variant="critical">
                          {launch.workstreams.filter((w) => w.overdueDays > 0).length}{" "}
                          overdue
                        </Badge>
                      ) : null}
                      {launch.workstreams.some((w) => w.status === "amber") ? (
                        <Badge variant="watch">
                          {launch.workstreams.filter((w) => w.status === "amber").length}{" "}
                          watch
                        </Badge>
                      ) : null}
                      <Badge variant="secondary">
                        {launch.workstreams.filter((w) => w.status === "green").length}/
                        {launch.workstreams.length} green
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <GanttBoard launch={launch} />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-xs text-jx-muted">
          Readiness score is a workstream-weighted progress index. Red bars
          indicate overdue items requiring escalation per the launch playbook.
        </div>
      </div>
    </div>
  );
}
