"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { AircraftFlight } from "@/lib/data/opensky";
import { useMounted } from "@/lib/use-mounted";

export function FlightHistoryChart({ flights }: { flights: AircraftFlight[] }) {
  const mounted = useMounted();
  const byDay = flights.reduce<Record<string, number>>((acc, f) => {
    const day = new Date(f.firstSeen * 1000).toISOString().slice(5, 10);
    acc[day] = (acc[day] ?? 0) + 1;
    return acc;
  }, {});
  const data = Object.entries(byDay)
    .map(([day, flights]) => ({ day, flights }))
    .sort((a, b) => a.day.localeCompare(b.day));

  if (data.length === 0) {
    return (
      <div className="h-56 grid place-items-center text-sm text-jx-muted border border-jx-border rounded-md bg-jx-panel/30">
        No OpenSky flight history in the selected window.
      </div>
    );
  }

  return (
    <div className="h-56 w-full">
      {!mounted ? (
        <div className="h-full rounded-md border border-jx-border bg-jx-panel/30" />
      ) : (
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="var(--jx-border)" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="day"
            stroke="var(--jx-muted)"
            tick={{ fill: "var(--jx-muted)", fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            stroke="var(--jx-muted)"
            tick={{ fill: "var(--jx-muted)", fontSize: 11 }}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(243, 112, 33, 0.08)" }}
            contentStyle={{
              background: "var(--jx-elev)",
              border: "1px solid var(--jx-border)",
              borderRadius: 6,
              fontSize: 12,
            }}
          />
          <Bar dataKey="flights" fill="var(--jx-gold)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      )}
    </div>
  );
}
