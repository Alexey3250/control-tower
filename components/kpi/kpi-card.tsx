"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  delta?: number;
  deltaSuffix?: string;
  intent?: "neutral" | "good" | "warn" | "bad";
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

const intentRing: Record<NonNullable<KpiCardProps["intent"]>, string> = {
  neutral: "",
  good: "ring-1 ring-jx-healthy/30",
  warn: "ring-1 ring-jx-watch/30",
  bad: "ring-1 ring-jx-critical/40",
};

export function KpiCard({
  label,
  value,
  hint,
  delta,
  deltaSuffix = "%",
  intent = "neutral",
  icon,
  children,
}: KpiCardProps) {
  const trendIcon =
    delta === undefined ? null : delta > 0 ? (
      <ArrowUpRight className="h-3.5 w-3.5" />
    ) : delta < 0 ? (
      <ArrowDownRight className="h-3.5 w-3.5" />
    ) : (
      <Minus className="h-3.5 w-3.5" />
    );

  const trendColor =
    delta === undefined
      ? ""
      : delta > 0
        ? "text-jx-healthy"
        : delta < 0
          ? "text-jx-critical"
          : "text-jx-muted";

  return (
    <Card className={cn("flex flex-col", intentRing[intent])}>
      <CardHeader className="flex flex-row items-start justify-between pb-2 p-4">
        <CardTitle className="text-[10px]">{label}</CardTitle>
        {icon ? <div className="text-jx-muted">{icon}</div> : null}
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-1 flex flex-col justify-end gap-2">
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-display tracking-tight text-jx-text">
            {value}
          </div>
          {delta !== undefined ? (
            <div className={cn("flex items-center text-xs gap-0.5", trendColor)}>
              {trendIcon}
              {Math.abs(delta).toFixed(1)}
              {deltaSuffix}
            </div>
          ) : null}
        </div>
        {hint ? <div className="text-xs text-jx-muted">{hint}</div> : null}
        {children}
      </CardContent>
    </Card>
  );
}
