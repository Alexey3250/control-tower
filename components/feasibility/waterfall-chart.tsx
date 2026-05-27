"use client";

import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMounted } from "@/lib/use-mounted";

interface WaterfallChartProps {
  data: { label: string; value: number }[];
}

export function WaterfallChart({ data }: WaterfallChartProps) {
  const mounted = useMounted();
  // Compute floating bars (start, height) so positive/negative cascade visually.
  const series = data.reduce<
    Array<{
      label: string;
      start: number;
      value: number;
      signed?: number;
      isFinal: boolean;
    }>
  >((acc, d, i) => {
    const isFinal = i === data.length - 1;
    if (isFinal) {
      acc.push({ label: d.label, start: 0, value: d.value, isFinal });
      return acc;
    }
    const running = acc.reduce((s, item) => s + (item.signed ?? 0), 0);
    const start = d.value >= 0 ? running : running + d.value;
    acc.push({
      label: d.label,
      start,
      value: Math.abs(d.value),
      signed: d.value,
      isFinal,
    });
    return acc;
  }, []);

  return (
    <div className="h-72 w-full">
      {!mounted ? (
        <div className="h-full rounded-md border border-jx-border bg-jx-panel/30" />
      ) : (
      <ResponsiveContainer>
        <BarChart data={series} margin={{ top: 12, right: 12, bottom: 12, left: 0 }}>
          <CartesianGrid stroke="var(--jx-border)" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="var(--jx-muted)"
            tick={{ fill: "var(--jx-muted)", fontSize: 11 }}
            axisLine={{ stroke: "var(--jx-border)" }}
            tickLine={false}
          />
          <YAxis
            stroke="var(--jx-muted)"
            tick={{ fill: "var(--jx-muted)", fontSize: 11 }}
            axisLine={{ stroke: "var(--jx-border)" }}
            tickLine={false}
            tickFormatter={(v) => `${Math.round(v / 1000)}k`}
          />
          <Tooltip
            cursor={{ fill: "rgba(243, 112, 33, 0.08)" }}
            contentStyle={{
              background: "var(--jx-elev)",
              border: "1px solid var(--jx-border)",
              borderRadius: 6,
              color: "var(--jx-text)",
              fontSize: 12,
            }}
            formatter={(_v, _n, ctx) => {
              const item = ctx?.payload as
                | { signed?: number; value: number; isFinal?: boolean }
                | undefined;
              const v = item?.signed ?? item?.value ?? 0;
              return [
                new Intl.NumberFormat("en-US", {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                }).format(v),
                item?.isFinal ? "EBITDA" : "Δ",
              ];
            }}
          />
          {/* Invisible spacer for floating bars */}
          <Bar dataKey="start" stackId="w" fill="transparent" />
          <Bar dataKey="value" stackId="w" radius={[3, 3, 0, 0]}>
            {series.map((d, i) => (
              <Cell
                key={i}
                fill={
                  d.isFinal
                    ? "var(--jx-gold)"
                    : (d.signed ?? 0) >= 0
                      ? "var(--jx-healthy)"
                      : "var(--jx-critical)"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      )}
    </div>
  );
}
