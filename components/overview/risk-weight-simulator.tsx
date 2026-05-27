"use client";

import Link from "next/link";
import * as React from "react";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusPill } from "@/components/kpi/status-pill";
import { RISK_WEIGHTS } from "@/config/risk-weights";
import {
  RISK_LABELS,
  rankStationsByRisk,
  type RiskWeightKey,
  type RiskWeights,
} from "@/lib/risk/score";
import type { StationKpiBundle } from "@/lib/types";

export function RiskWeightSimulator({
  snapshot,
}: {
  snapshot: StationKpiBundle[];
}) {
  const [weights, setWeights] = React.useState<RiskWeights>({
    ...RISK_WEIGHTS,
  });

  const ranked = React.useMemo(
    () => rankStationsByRisk(snapshot, weights).slice(0, 8),
    [snapshot, weights]
  );

  function update(key: RiskWeightKey, value: number) {
    setWeights((prev) => ({ ...prev, [key]: value / 100 }));
  }

  function reset() {
    setWeights({ ...RISK_WEIGHTS });
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div>
          <CardTitle>Risk-weight what-if</CardTitle>
          <p className="mt-1 text-xs text-jx-muted">
            Tune the risk model and re-rank which stations need attention first.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={reset}>
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </Button>
      </CardHeader>
      <CardContent className="grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-5">
        <div className="space-y-4 rounded-md border border-jx-border bg-jx-panel/40 p-4">
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-jx-muted">
            <SlidersHorizontal className="h-3.5 w-3.5 text-jx-gold" />
            Model weights
          </div>
          {(Object.keys(weights) as RiskWeightKey[]).map((key) => (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-jx-muted">{RISK_LABELS[key]}</span>
                <span className="font-mono text-jx-gold">
                  {Math.round(weights[key] * 100)}%
                </span>
              </div>
              <Slider
                min={0}
                max={40}
                step={1}
                value={[Math.round(weights[key] * 100)]}
                onValueChange={([v]) => update(key, v)}
              />
            </div>
          ))}
          <div className="text-[11px] text-jx-muted leading-relaxed">
            Scores are normalised by total selected weight, so you can safely set
            any dimension to zero.
          </div>
        </div>

        <div className="rounded-md border border-jx-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Station</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Top simulated risk</TableHead>
                <TableHead className="text-right">Δ vs base</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ranked.map((row, i) => (
                <TableRow key={row.station.icao}>
                  <TableCell className="font-mono text-jx-muted">
                    #{i + 1}
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/stations/${row.station.icao}`}
                      className="hover:text-jx-gold"
                    >
                      <div className="font-medium text-jx-text">
                        {row.station.city}
                      </div>
                      <div className="text-xs text-jx-muted font-mono">
                        {row.station.icao} · {row.station.region}
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    {row.computedRisk.score}
                  </TableCell>
                  <TableCell>
                    <StatusPill status={row.computedRisk.status} />
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{row.computedRisk.topRisk}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {row.computedRisk.score - row.current.riskScore > 0 ? "+" : ""}
                    {row.computedRisk.score - row.current.riskScore}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
