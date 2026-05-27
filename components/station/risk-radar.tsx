"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import type { StationKpis } from "@/lib/types";
import { RISK_WEIGHTS } from "@/config/risk-weights";
import { useMounted } from "@/lib/use-mounted";

interface RiskRadarProps {
  kpis: StationKpis;
}

export function RiskRadar({ kpis }: RiskRadarProps) {
  const mounted = useMounted();
  const data = [
    { dim: "Traffic", v: Math.round(kpis.turnsLast24h ? Math.min(100, kpis.turnsLast24h * 1.3) : 0) },
    { dim: "Weather", v: Math.round(100 - kpis.slotCompliance * 100) },
    {
      dim: "Manpower",
      v: Math.round((1 - kpis.manpowerCoverage) * 100),
    },
    { dim: "Vendor", v: Math.round((kpis.vendorBreaches7d / 5) * 100) },
    { dim: "Safety", v: Math.round((kpis.openIncidents / 3) * 100) },
    {
      dim: "Cost",
      v: Math.round(Math.max(0, kpis.costVariancePct) * 7),
    },
  ];

  return (
    <div className="h-64 w-full">
      {mounted ? (
        <ResponsiveContainer>
          <RadarChart data={data} outerRadius="75%">
            <PolarGrid stroke="var(--jx-border-strong)" />
            <PolarAngleAxis
              dataKey="dim"
              tick={{ fill: "var(--jx-muted)", fontSize: 11 }}
              stroke="var(--jx-border)"
            />
            <Radar
              dataKey="v"
              stroke="var(--jx-gold)"
              fill="var(--jx-gold)"
              fillOpacity={0.25}
            />
          </RadarChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-56 rounded-md border border-jx-border bg-jx-panel/30" />
      )}
      <div className="text-[10px] text-jx-subtle text-center -mt-2">
        Weights · traffic {Math.round(RISK_WEIGHTS.trafficPressure * 100)}% · weather{" "}
        {Math.round(RISK_WEIGHTS.weatherRisk * 100)}% · manpower{" "}
        {Math.round(RISK_WEIGHTS.manpowerCoverage * 100)}% · vendor{" "}
        {Math.round(RISK_WEIGHTS.vendorSlaBreach * 100)}% · safety{" "}
        {Math.round(RISK_WEIGHTS.safetyIncidents * 100)}% · cost{" "}
        {Math.round(RISK_WEIGHTS.costVariance * 100)}%
      </div>
    </div>
  );
}
