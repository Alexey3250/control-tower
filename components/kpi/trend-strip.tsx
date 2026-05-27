"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { useMounted } from "@/lib/use-mounted";

export function TrendStrip({
  data,
  color = "var(--jx-gold)",
  height = 36,
}: {
  data: { day: string; value: number }[];
  color?: string;
  height?: number;
}) {
  const mounted = useMounted();
  if (!mounted) {
    return <div style={{ width: "100%", height }} className="mt-1" />;
  }

  return (
    <div style={{ width: "100%", height }} className="mt-1">
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.45} />
              <stop offset="100%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill="url(#trendFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
