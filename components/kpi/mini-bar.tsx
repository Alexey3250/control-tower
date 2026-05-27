"use client";

import { Bar, BarChart, ResponsiveContainer, Tooltip } from "recharts";
import { useMounted } from "@/lib/use-mounted";

interface MiniBarProps {
  data: { day: string; value: number }[];
  color?: string;
  height?: number;
}

export function MiniBar({ data, color = "var(--jx-gold)", height = 48 }: MiniBarProps) {
  const mounted = useMounted();
  if (!mounted) return <div style={{ width: "100%", height }} />;

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 2, right: 2, bottom: 0, left: 0 }}>
          <Tooltip
            cursor={{ fill: "rgba(243, 112, 33, 0.08)" }}
            contentStyle={{
              background: "var(--jx-elev)",
              border: "1px solid var(--jx-border)",
              borderRadius: 6,
              padding: "4px 8px",
              fontSize: 11,
              color: "var(--jx-text)",
            }}
            labelStyle={{ color: "var(--jx-muted)" }}
          />
          <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
