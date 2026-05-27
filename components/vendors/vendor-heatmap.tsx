"use client";

import * as React from "react";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { downloadCsv, downloadXlsx } from "@/lib/exports";
import { useMounted } from "@/lib/use-mounted";
import type { VendorScore } from "@/lib/types";

interface VendorHeatmapProps {
  vendors: VendorScore[];
}

const COLUMNS: {
  key: keyof Pick<
    VendorScore,
    "onTime" | "quality" | "costCompliance" | "incidentRate" | "overall"
  >;
  label: string;
}[] = [
  { key: "onTime", label: "On-time" },
  { key: "quality", label: "Quality" },
  { key: "costCompliance", label: "Cost compliance" },
  { key: "incidentRate", label: "Incident rate" },
  { key: "overall", label: "Overall" },
];

function cellShade(score: number) {
  // 50 = red, 75 = amber, 90 = green
  if (score >= 88) return "bg-jx-healthy/30 text-jx-healthy ring-1 ring-jx-healthy/40";
  if (score >= 78) return "bg-jx-healthy/15 text-jx-healthy";
  if (score >= 68) return "bg-jx-watch/20 text-jx-watch";
  if (score >= 58) return "bg-jx-watch/30 text-jx-watch ring-1 ring-jx-watch/40";
  return "bg-jx-critical/25 text-jx-critical ring-1 ring-jx-critical/50";
}

interface CellClick {
  vendor: VendorScore;
  column: (typeof COLUMNS)[number];
}

export function VendorHeatmap({ vendors }: VendorHeatmapProps) {
  const mounted = useMounted();
  const [open, setOpen] = React.useState(false);
  const [active, setActive] = React.useState<CellClick | null>(null);
  const [region, setRegion] = React.useState<string>("All");

  const regions = React.useMemo(
    () => ["All", ...Array.from(new Set(vendors.map((v) => v.region)))],
    [vendors]
  );

  const filtered = React.useMemo(
    () =>
      region === "All" ? vendors : vendors.filter((v) => v.region === region),
    [vendors, region]
  );

  function onCellClick(vendor: VendorScore, column: (typeof COLUMNS)[number]) {
    setActive({ vendor, column });
    setOpen(true);
  }

  function exportXlsx() {
    const rows = vendors.map((v) => ({
      Vendor: v.vendor,
      Category: v.category,
      Region: v.region,
      "On-time": v.onTime,
      Quality: v.quality,
      "Cost compliance": v.costCompliance,
      "Incident rate": v.incidentRate,
      Overall: v.overall,
      "SLA Breaches": v.slaBreaches,
      "Contract Value USD": v.contractValueUsd,
    }));
    downloadXlsx(rows, "jetex-vendor-scorecard", "Vendors");
  }

  function exportCsv() {
    const rows = vendors.map((v) => ({
      vendor: v.vendor,
      category: v.category,
      region: v.region,
      on_time: v.onTime,
      quality: v.quality,
      cost_compliance: v.costCompliance,
      incident_rate: v.incidentRate,
      overall: v.overall,
      sla_breaches: v.slaBreaches,
      contract_value_usd: v.contractValueUsd,
    }));
    downloadCsv(rows, "jetex-vendor-scorecard");
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {regions.map((r) => (
            <Button
              key={r}
              size="sm"
              variant={r === region ? "gold" : "outline"}
              onClick={() => setRegion(r)}
            >
              {r}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={exportCsv}>
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
          <Button size="sm" variant="gold" onClick={exportXlsx}>
            <Download className="h-3.5 w-3.5" /> XLSX
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-jx-border">
        <table className="w-full text-sm">
          <thead className="bg-jx-panel">
            <tr>
              <th className="text-left px-3 py-2 text-xs uppercase tracking-wider text-jx-muted font-semibold">
                Vendor
              </th>
              <th className="text-left px-3 py-2 text-xs uppercase tracking-wider text-jx-muted font-semibold">
                Category
              </th>
              <th className="text-left px-3 py-2 text-xs uppercase tracking-wider text-jx-muted font-semibold">
                Region
              </th>
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  className="text-center px-2 py-2 text-xs uppercase tracking-wider text-jx-muted font-semibold"
                >
                  {c.label}
                </th>
              ))}
              <th className="text-right px-3 py-2 text-xs uppercase tracking-wider text-jx-muted font-semibold">
                SLA Breaches
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((v) => (
              <tr
                key={v.vendorId}
                className="border-t border-jx-border hover:bg-jx-panel/40 transition-colors"
              >
                <td className="px-3 py-2">
                  <div className="font-medium text-jx-text">{v.vendor}</div>
                  <div className="text-[10px] text-jx-muted font-mono">
                    {v.vendorId}
                  </div>
                </td>
                <td className="px-3 py-2 text-jx-muted text-xs">{v.category}</td>
                <td className="px-3 py-2 text-jx-muted text-xs">{v.region}</td>
                {COLUMNS.map((c) => {
                  const score = v[c.key] as number;
                  return (
                    <td key={c.key} className="px-1.5 py-1.5 text-center">
                      <button
                        onClick={() => onCellClick(v, c)}
                        className={cn(
                          "h-8 w-14 inline-flex items-center justify-center rounded font-mono text-sm transition-transform hover:scale-105",
                          cellShade(score)
                        )}
                      >
                        {score}
                      </button>
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-right">
                  {v.slaBreaches > 0 ? (
                    <Badge variant={v.slaBreaches > 3 ? "critical" : "watch"}>
                      {v.slaBreaches}
                    </Badge>
                  ) : (
                    <span className="text-jx-subtle font-mono">0</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          {active ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {active.vendor.vendor} · {active.column.label}
                </DialogTitle>
                <DialogDescription>
                  {active.vendor.category} · {active.vendor.region} ·{" "}
                  {active.vendor.vendorId}
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <Stat
                  label="Current"
                  value={`${active.vendor[active.column.key] as number}/100`}
                />
                <Stat
                  label="Overall"
                  value={`${active.vendor.overall}/100`}
                />
                <Stat
                  label="SLA breaches"
                  value={String(active.vendor.slaBreaches)}
                />
                <Stat
                  label="Contract value"
                  value={new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: "USD",
                    maximumFractionDigits: 0,
                  }).format(active.vendor.contractValueUsd)}
                />
              </div>

              <div className="h-56 w-full mt-2">
                {!mounted ? (
                  <div className="h-full rounded-md border border-jx-border bg-jx-panel/30" />
                ) : (
                <ResponsiveContainer>
                  <LineChart
                    data={active.vendor.trend12w.map((y, i) => ({
                      week: `W-${12 - i}`,
                      score: y,
                    }))}
                    margin={{ top: 8, right: 12, bottom: 4, left: -8 }}
                  >
                    <XAxis
                      dataKey="week"
                      stroke="var(--jx-muted)"
                      tick={{ fill: "var(--jx-muted)", fontSize: 11 }}
                      tickLine={false}
                    />
                    <YAxis
                      domain={[40, 100]}
                      stroke="var(--jx-muted)"
                      tick={{ fill: "var(--jx-muted)", fontSize: 11 }}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--jx-elev)",
                        border: "1px solid var(--jx-border)",
                        borderRadius: 6,
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="var(--jx-gold)"
                      strokeWidth={2}
                      dot={{ fill: "var(--jx-gold)", r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                )}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-jx-border bg-jx-panel/40 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-jx-muted">
        {label}
      </div>
      <div className="font-mono text-jx-text text-sm mt-0.5">{value}</div>
    </div>
  );
}
