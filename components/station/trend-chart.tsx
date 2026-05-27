"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { KpiTrendPoint } from "@/lib/types";
import { useMounted } from "@/lib/use-mounted";

export function StationTrendChart({ data }: { data: KpiTrendPoint[] }) {
  const mounted = useMounted();
  if (!mounted) {
    return <div className="h-64 w-full rounded-md border border-jx-border bg-jx-panel/30" />;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="turnsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--jx-gold)" stopOpacity={0.5} />
              <stop offset="100%" stopColor="var(--jx-gold)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="paxGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--jx-red)" stopOpacity={0.4} />
              <stop offset="100%" stopColor="var(--jx-red)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--jx-border)" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="day"
            stroke="var(--jx-muted)"
            tick={{ fill: "var(--jx-muted)", fontSize: 10 }}
            tickLine={false}
            tickFormatter={(d) => d.slice(5)}
          />
          <YAxis
            stroke="var(--jx-muted)"
            tick={{ fill: "var(--jx-muted)", fontSize: 10 }}
            tickLine={false}
            yAxisId="left"
          />
          <YAxis
            stroke="var(--jx-muted)"
            tick={{ fill: "var(--jx-muted)", fontSize: 10 }}
            tickLine={false}
            yAxisId="right"
            orientation="right"
          />
          <Tooltip
            contentStyle={{
              background: "var(--jx-elev)",
              border: "1px solid var(--jx-border)",
              borderRadius: 6,
              fontSize: 12,
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: "var(--jx-muted)" }}
            iconType="circle"
          />
          <Area
            yAxisId="left"
            type="monotone"
            name="Turns"
            dataKey="turns"
            stroke="var(--jx-gold)"
            fill="url(#turnsGrad)"
          />
          <Area
            yAxisId="right"
            type="monotone"
            name="PAX"
            dataKey="pax"
            stroke="var(--jx-red)"
            fill="url(#paxGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
