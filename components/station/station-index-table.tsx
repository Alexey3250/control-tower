"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowUpDown, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { StatusPill } from "@/components/kpi/status-pill";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { downloadXlsx } from "@/lib/exports";
import { formatPercent } from "@/lib/utils";
import type { StationKpiBundle } from "@/lib/types";

type SortKey =
  | "city"
  | "region"
  | "riskScore"
  | "turnsLast24h"
  | "slotCompliance"
  | "manpowerCoverage";

export function StationIndexTable({
  snapshot,
}: {
  snapshot: StationKpiBundle[];
}) {
  const [query, setQuery] = React.useState("");
  const [region, setRegion] = React.useState("All");
  const [sortKey, setSortKey] = React.useState<SortKey>("riskScore");
  const [desc, setDesc] = React.useState(true);

  const regions = React.useMemo(
    () => ["All", ...Array.from(new Set(snapshot.map((s) => s.station.region)))],
    [snapshot]
  );

  const rows = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return snapshot
      .filter((row) => region === "All" || row.station.region === region)
      .filter((row) =>
        q
          ? [
              row.station.city,
              row.station.name,
              row.station.country,
              row.station.icao,
              row.station.iata ?? "",
            ]
              .join(" ")
              .toLowerCase()
              .includes(q)
          : true
      )
      .sort((a, b) => {
        let av: string | number;
        let bv: string | number;
        if (sortKey === "city") {
          av = a.station.city;
          bv = b.station.city;
        } else if (sortKey === "region") {
          av = a.station.region;
          bv = b.station.region;
        } else {
          av = a.current[sortKey];
          bv = b.current[sortKey];
        }
        const result =
          typeof av === "number" && typeof bv === "number"
            ? av - bv
            : String(av).localeCompare(String(bv));
        return desc ? -result : result;
      });
  }, [desc, query, region, snapshot, sortKey]);

  function setSort(key: SortKey) {
    if (key === sortKey) {
      setDesc((v) => !v);
      return;
    }
    setSortKey(key);
    setDesc(key === "riskScore" || key === "turnsLast24h");
  }

  function exportRows() {
    downloadXlsx(
      rows.map(({ station, current }) => ({
        ICAO: station.icao,
        IATA: station.iata ?? "",
        Station: station.name,
        City: station.city,
        Country: station.country,
        Region: station.region,
        Tier: station.tier,
        Status: current.status,
        "Risk Score": current.riskScore,
        "Top Risk": current.topRisk,
        "Turns 24h": current.turnsLast24h,
        "Avg Turnaround Min": current.avgTurnaroundMin,
        "Slot Compliance": current.slotCompliance,
        "Ramp Efficiency": current.rampEfficiency,
        "Manpower Coverage": current.manpowerCoverage,
        "Vendor Breaches 7d": current.vendorBreaches7d,
        "Open Incidents": current.openIncidents,
        "Cost Variance %": current.costVariancePct,
      })),
      "jetex-station-risk-index",
      "Stations"
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-jx-muted" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
            placeholder="Search city, ICAO, station..."
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {regions.map((r) => (
            <Button
              key={r}
              variant={r === region ? "gold" : "outline"}
              size="sm"
              onClick={() => setRegion(r)}
            >
              {r}
            </Button>
          ))}
          <Button variant="gold" size="sm" onClick={exportRows}>
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </div>

      <div className="rounded-lg border border-jx-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableHead label="Station" onClick={() => setSort("city")} />
              <SortableHead label="Region" onClick={() => setSort("region")} />
              <SortableHead
                label="Risk"
                align="right"
                onClick={() => setSort("riskScore")}
              />
              <TableHead>Status</TableHead>
              <SortableHead
                label="Turns"
                align="right"
                onClick={() => setSort("turnsLast24h")}
              />
              <SortableHead
                label="Slot"
                align="right"
                onClick={() => setSort("slotCompliance")}
              />
              <TableHead className="text-right">Ramp</TableHead>
              <SortableHead
                label="Manpower"
                align="right"
                onClick={() => setSort("manpowerCoverage")}
              />
              <TableHead>Top risk</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ station, current }) => (
              <TableRow key={station.icao}>
                <TableCell>
                  <Link
                    href={`/stations/${station.icao}`}
                    className="hover:text-jx-gold"
                  >
                    <div className="font-medium text-jx-text">{station.city}</div>
                    <div className="text-xs text-jx-muted font-mono">
                      {station.icao} · {station.iata ?? "—"} · {station.name}
                    </div>
                  </Link>
                </TableCell>
                <TableCell className="text-jx-muted">{station.region}</TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {current.riskScore}
                </TableCell>
                <TableCell>
                  <StatusPill status={current.status} />
                </TableCell>
                <TableCell className="text-right font-mono">
                  {current.turnsLast24h}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatPercent(current.slotCompliance, 1)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatPercent(current.rampEfficiency, 1)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatPercent(current.manpowerCoverage, 0)}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{current.topRisk}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
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
