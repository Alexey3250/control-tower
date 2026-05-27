"use client";

import * as React from "react";
import { parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import type { LaunchTracker, Workstream } from "@/lib/types";

interface GanttBoardProps {
  launch: LaunchTracker;
}

function ragStyles(status: Workstream["status"]) {
  switch (status) {
    case "green":
      return {
        bar: "bg-jx-healthy/30 border border-jx-healthy/50",
        fill: "bg-jx-healthy/80",
        label: "text-jx-healthy",
      };
    case "amber":
      return {
        bar: "bg-jx-watch/25 border border-jx-watch/50",
        fill: "bg-jx-watch/80",
        label: "text-jx-watch",
      };
    case "red":
      return {
        bar: "bg-jx-critical/25 border border-jx-critical/50",
        fill: "bg-jx-critical/80",
        label: "text-jx-critical",
      };
  }
}

export function GanttBoard({ launch }: GanttBoardProps) {
  const starts = launch.workstreams.map((w) => parseISO(w.start).getTime());
  const ends = launch.workstreams.map((w) => parseISO(w.end).getTime());
  const min = Math.min(...starts);
  const max = Math.max(...ends);
  const [today] = React.useState(() => Date.now());
  const todayPct = ((today - min) / (max - min)) * 100;

  // Month markers
  const monthMarkers = React.useMemo(() => {
    const out: { label: string; pct: number }[] = [];
    const start = new Date(min);
    const end = new Date(max);
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cursor <= end) {
      const pct = ((cursor.getTime() - min) / (max - min)) * 100;
      out.push({
        label: cursor.toLocaleDateString("en", {
          month: "short",
          year: "2-digit",
        }),
        pct,
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return out;
  }, [min, max]);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-[200px_1fr] gap-3 items-stretch">
        <div />
        <div className="relative h-6">
          {monthMarkers.map((m, i) => (
            <div
              key={i}
              className="absolute top-0 h-full border-l border-jx-border text-[10px] text-jx-muted font-mono pl-1"
              style={{ left: `${m.pct}%` }}
            >
              {m.label}
            </div>
          ))}
        </div>
      </div>

      {launch.workstreams.map((w) => {
        const startPct = ((parseISO(w.start).getTime() - min) / (max - min)) * 100;
        const endPct = ((parseISO(w.end).getTime() - min) / (max - min)) * 100;
        const widthPct = Math.max(2, endPct - startPct);
        const styles = ragStyles(w.status);

        return (
          <div
            key={w.key}
            className="grid grid-cols-[200px_1fr] gap-3 items-center"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    w.status === "green"
                      ? "bg-jx-healthy"
                      : w.status === "amber"
                        ? "bg-jx-watch"
                        : "bg-jx-critical"
                  )}
                />
                <div className="text-sm text-jx-text truncate font-medium">
                  {w.label}
                </div>
              </div>
              <div className="text-[11px] text-jx-muted truncate ml-4">
                {w.owner} · {Math.round(w.progress * 100)}%
                {w.overdueDays > 0 ? (
                  <span className="ml-1 text-jx-critical">
                    · {w.overdueDays}d overdue
                  </span>
                ) : null}
              </div>
            </div>

            <div className="relative h-7 bg-jx-panel/40 border border-jx-border rounded">
              <div
                className={cn(
                  "absolute top-0 bottom-0 rounded overflow-hidden",
                  styles.bar
                )}
                style={{ left: `${startPct}%`, width: `${widthPct}%` }}
              >
                <div
                  className={cn("h-full", styles.fill)}
                  style={{ width: `${w.progress * 100}%` }}
                />
              </div>
              {todayPct > 0 && todayPct < 100 ? (
                <div
                  className="absolute top-0 bottom-0 w-px bg-jx-gold"
                  style={{ left: `${todayPct}%` }}
                  title="Today"
                />
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
