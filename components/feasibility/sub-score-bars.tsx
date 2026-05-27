"use client";

import { cn } from "@/lib/utils";

interface SubScoreBarsProps {
  scores: Record<string, number>;
}

const LABELS: Record<string, string> = {
  demandFit: "Demand fit",
  weatherTolerability: "Weather",
  costEfficiency: "Cost efficiency",
  regulatoryEase: "Regulatory ease",
  networkSynergy: "Network synergy",
};

function colorFor(v: number) {
  if (v >= 0.7) return "bg-jx-healthy";
  if (v >= 0.5) return "bg-jx-watch";
  return "bg-jx-critical";
}

export function SubScoreBars({ scores }: SubScoreBarsProps) {
  return (
    <div className="space-y-2.5">
      {Object.entries(scores).map(([k, v]) => (
        <div key={k} className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-jx-muted">{LABELS[k] ?? k}</span>
            <span className="font-mono text-jx-text">
              {Math.round(v * 100)}/100
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-jx-panel border border-jx-border overflow-hidden">
            <div
              className={cn("h-full transition-all", colorFor(v))}
              style={{ width: `${v * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
