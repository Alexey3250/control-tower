"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpDown, Download, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FLEET_LAYERS, FLEET_UI_STATUS_LABELS } from "@/config/fleet";
import type { FleetLayer } from "@/config/fleet";
import { downloadXlsx } from "@/lib/exports";
import { mToFt, msToKt, nearestStation } from "@/lib/geo";
import type { AircraftState, FleetStatus } from "@/lib/data/opensky";
import { cn } from "@/lib/utils";

interface FleetTableProps {
  aircraft: AircraftState[];
}

type SortKey = "tail" | "status" | "model" | "lastContact" | "speed" | "layer";

function statusVariant(status: FleetStatus) {
  if (status === "flying") return "healthy" as const;
  if (status === "parked") return "gold" as const;
  return "secondary" as const;
}

function lastSeen(unix: number) {
  if (!unix) return "No live OpenSky state";
  return new Date(unix * 1000).toLocaleString();
}

const LAYER_LABEL: Record<FleetLayer, string> = {
  core: "Core",
  additional: "Additional",
  "dwc-ecosystem": "DWC ecosystem",
  simulated: "Simulated",
};

const LAYER_TONE: Record<FleetLayer, string> = {
  core: "bg-jx-orange-tint text-jx-orange-deep border-jx-orange/30",
  additional: "bg-jx-panel text-jx-text border-jx-border",
  "dwc-ecosystem": "bg-jx-panel text-jx-muted border-jx-border",
  simulated: "text-white border-transparent",
};

export function FleetTable({ aircraft }: FleetTableProps) {
  const [sortKey, setSortKey] = React.useState<SortKey>("status");
  const [desc, setDesc] = React.useState(false);
  const [layerFilter, setLayerFilter] = React.useState<FleetLayer | "all">(
    "all"
  );

  const filtered = React.useMemo(
    () =>
      layerFilter === "all"
        ? aircraft
        : aircraft.filter((a) => a.layer === layerFilter),
    [aircraft, layerFilter]
  );

  const sorted = React.useMemo(() => {
    const statusRank: Record<FleetStatus, number> = {
      flying: 0,
      parked: 1,
      offline: 2,
    };
    const layerRank: Record<FleetLayer, number> = {
      core: 0,
      additional: 1,
      "dwc-ecosystem": 2,
      simulated: 3,
    };
    return [...filtered].sort((a, b) => {
      let av: string | number;
      let bv: string | number;
      if (sortKey === "status") {
        av = statusRank[a.status];
        bv = statusRank[b.status];
      } else if (sortKey === "speed") {
        av = a.velocityMs ?? -1;
        bv = b.velocityMs ?? -1;
      } else if (sortKey === "layer") {
        av = layerRank[a.layer];
        bv = layerRank[b.layer];
      } else {
        av = a[sortKey] ?? "";
        bv = b[sortKey] ?? "";
      }
      const result =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return desc ? -result : result;
    });
  }, [filtered, desc, sortKey]);

  function setSort(next: SortKey) {
    if (next === sortKey) {
      setDesc((v) => !v);
      return;
    }
    setSortKey(next);
    setDesc(false);
  }

  function exportRows() {
    downloadXlsx(
      sorted.map((a) => {
        const near =
          a.lat !== null && a.lon !== null ? nearestStation(a.lat, a.lon) : null;
        return {
          Registration: a.tail,
          ICAO24: a.icao24,
          Status: a.status,
          "UI Status": FLEET_UI_STATUS_LABELS[a.uiStatus].label,
          Model: a.model,
          Type: a.typeCode,
          "Jetex Relationship": a.jetexRelationship,
          "Broadcast Operator": a.broadcastOperator ?? "",
          Layer: LAYER_LABEL[a.layer],
          Confidence: a.confidence,
          Callsign: a.callsign ?? "",
          Latitude: a.lat ?? "",
          Longitude: a.lon ?? "",
          "Nearest Jetex Station": near?.station.icao ?? "",
          "Distance NM": near ? Number(near.distanceNm.toFixed(1)) : "",
          "Altitude FT":
            a.baroAltitudeM !== null ? Math.round(mToFt(a.baroAltitudeM)) : "",
          "Speed KT": a.velocityMs !== null ? Math.round(msToKt(a.velocityMs)) : "",
          Heading: a.trackDeg !== null ? Math.round(a.trackDeg) : "",
          "Last Seen": lastSeen(a.lastContact),
        };
      }),
      "jetex-fleet-status",
      "Fleet"
    );
  }

  const counts = React.useMemo(() => {
    return {
      all: aircraft.length,
      core: aircraft.filter((a) => a.layer === "core").length,
      additional: aircraft.filter((a) => a.layer === "additional").length,
      "dwc-ecosystem": aircraft.filter((a) => a.layer === "dwc-ecosystem").length,
      simulated: aircraft.filter((a) => a.layer === "simulated").length,
    };
  }, [aircraft]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <LayerChip
            label={`All · ${counts.all}`}
            active={layerFilter === "all"}
            onClick={() => setLayerFilter("all")}
          />
          {FLEET_LAYERS.map((l) => (
            <LayerChip
              key={l.id}
              label={`${l.label} · ${counts[l.id]}`}
              active={layerFilter === l.id}
              onClick={() => setLayerFilter(l.id)}
              title={l.description}
            />
          ))}
        </div>
        <Button variant="gold" size="sm" onClick={exportRows}>
          <Download className="h-3.5 w-3.5" />
          Export .xlsx
        </Button>
      </div>

      <div className="rounded-lg border border-jx-border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead label="Registration" onClick={() => setSort("tail")} />
              <SortableHead label="Status" onClick={() => setSort("status")} />
              <SortableHead label="Model" onClick={() => setSort("model")} />
              <SortableHead label="Layer" onClick={() => setSort("layer")} />
              <TableHead className="hidden md:table-cell">Location</TableHead>
              <TableHead className="text-right hidden lg:table-cell">
                Altitude
              </TableHead>
              <SortableHead
                label="Speed"
                align="right"
                onClick={() => setSort("speed")}
              />
              <SortableHead
                label="Last seen"
                onClick={() => setSort("lastContact")}
              />
              <TableHead className="text-right">Detail</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((a) => {
              const near =
                a.lat !== null && a.lon !== null
                  ? nearestStation(a.lat, a.lon)
                  : null;
              return (
                <TableRow key={a.icao24}>
                  <TableCell>
                    {a.layer === "simulated" ? (
                      <span
                        className="font-mono font-semibold text-jx-text"
                        title="Simulated demo flight — no drilldown page"
                      >
                        {a.tail}
                      </span>
                    ) : (
                      <Link
                        href={`/fleet/${a.icao24}`}
                        className="font-mono font-semibold text-jx-text hover:text-jx-orange"
                      >
                        {a.tail}
                      </Link>
                    )}
                    <div className="text-[11px] text-jx-muted font-mono">
                      {a.icao24}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(a.status)}>{a.status}</Badge>
                    <div className="text-[10px] text-jx-subtle mt-0.5 uppercase tracking-wider">
                      {FLEET_UI_STATUS_LABELS[a.uiStatus].label}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-jx-text text-sm">{a.model}</div>
                    <div className="text-[11px] text-jx-muted">
                      {a.typeCode} · confidence {a.confidence.replace("_", "·")}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wider",
                        LAYER_TONE[a.layer]
                      )}
                      style={
                        a.layer === "simulated"
                          ? { background: "#1f6aa6" }
                          : undefined
                      }
                    >
                      {LAYER_LABEL[a.layer]}
                    </span>
                    {a.broadcastOperator ? (
                      <div className="text-[10px] text-jx-subtle mt-0.5 truncate max-w-[160px]">
                        FR24: {a.broadcastOperator}
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-jx-muted hidden md:table-cell">
                    {near
                      ? `${near.station.icao} · ${near.station.city} (${near.distanceNm.toFixed(
                          0
                        )} nm)`
                      : a.lat !== null && a.lon !== null
                        ? `${a.lat.toFixed(2)}, ${a.lon.toFixed(2)}`
                        : a.homeBaseHint
                          ? `Home: ${a.homeBaseHint}`
                          : "No open-feed position"}
                  </TableCell>
                  <TableCell className="text-right font-mono hidden lg:table-cell">
                    {a.baroAltitudeM !== null
                      ? `${Math.round(mToFt(a.baroAltitudeM)).toLocaleString()} ft`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {a.velocityMs !== null
                      ? `${Math.round(msToKt(a.velocityMs))} kt`
                      : "—"}
                  </TableCell>
                  <TableCell className="text-xs text-jx-muted">
                    {lastSeen(a.lastContact)}
                  </TableCell>
                  <TableCell className="text-right">
                    {a.layer === "simulated" ? (
                      <span
                        className="inline-flex h-7 w-7 items-center justify-center text-jx-subtle"
                        title="Simulated demo flight — no drilldown page"
                      >
                        —
                      </span>
                    ) : (
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/fleet/${a.icao24}`}>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function LayerChip({
  label,
  active,
  onClick,
  title,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        "rounded-full px-3 py-1 text-xs border transition-colors",
        active
          ? "bg-jx-orange text-white border-jx-orange shadow-sm"
          : "bg-white text-jx-muted border-jx-border hover:text-jx-text"
      )}
    >
      {label}
    </button>
  );
}

function SortableHead({
  label,
  align,
  onClick,
}: {
  label: string;
  align?: "right";
  onClick: () => void;
}) {
  return (
    <TableHead className={align === "right" ? "text-right" : undefined}>
      <button
        className="inline-flex items-center gap-1 hover:text-jx-text"
        onClick={onClick}
      >
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </button>
    </TableHead>
  );
}
