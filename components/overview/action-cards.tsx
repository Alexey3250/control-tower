"use client";

import Link from "next/link";
import {
  AlertOctagon,
  AlertTriangle,
  ArrowUpRight,
  Lightbulb,
  ShieldAlert,
  TrendingUp,
  Users,
  Wind,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { StationKpiBundle } from "@/lib/types";

interface ActionCardsProps {
  snapshot: StationKpiBundle[];
}

type ActionTone = "critical" | "watch" | "opportunity";

interface ExecAction {
  icao: string;
  city: string;
  tone: ActionTone;
  headline: string;
  body: string;
  /** Short quantitative chip displayed in the bottom-left of the card. */
  metric: string;
  /** Verb-first call to action displayed on the bottom-right. */
  cta: string;
  icon: React.ReactNode;
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Tone → visual treatment table                                             */
/* ────────────────────────────────────────────────────────────────────────── */

const TONE_STYLES: Record<
  ActionTone,
  {
    /** Coloured rail on the left edge — the strongest visual differentiator. */
    rail: string;
    /** Soft tint fill so each card category reads at a glance. */
    surface: string;
    /** Outer border tint to match the rail. */
    border: string;
    /** Foreground colour for the icon + metric chip. */
    fg: string;
    /** Top-line label e.g. "ESCALATE NOW" / "MONITOR" / "OPPORTUNITY". */
    label: string;
    /** Pill colour for the top-line label. */
    pill: string;
    /** Hover lift colour for the CTA arrow. */
    cta: string;
  }
> = {
  critical: {
    rail: "before:bg-jx-critical",
    surface: "bg-[#fff5f2]",
    border: "border-jx-critical/35",
    fg: "text-jx-critical",
    label: "Escalate now",
    pill: "bg-jx-critical text-white",
    cta: "text-jx-critical",
  },
  watch: {
    rail: "before:bg-jx-watch",
    surface: "bg-[#fffaf0]",
    border: "border-jx-watch/40",
    fg: "text-jx-watch",
    label: "Monitor",
    pill: "bg-jx-watch text-white",
    cta: "text-jx-watch",
  },
  opportunity: {
    rail: "before:bg-jx-healthy",
    surface: "bg-[#f3faf6]",
    border: "border-jx-healthy/35",
    fg: "text-jx-healthy",
    label: "Opportunity",
    pill: "bg-jx-healthy text-white",
    cta: "text-jx-healthy",
  },
};

/* ────────────────────────────────────────────────────────────────────────── */
/*  Action synthesis                                                          */
/* ────────────────────────────────────────────────────────────────────────── */

function buildActions(snapshot: StationKpiBundle[]): ExecAction[] {
  const actions: ExecAction[] = [];
  const seen = new Set<string>(); // one card per station max
  /* Per-pattern cap. The synthetic data tends to surface many stations
     matching the same pattern (e.g. dozens with wx + thin crew at once),
     which made the card grid feel monotone. Limit each pattern to two
     fires so the executive sees a mix of severities and topics. */
  const patternCount = new Map<string, number>();
  const MAX_PER_PATTERN = 2;

  const tryPush = (a: ExecAction, patternId: string) => {
    if (actions.length >= 6) return;
    if (seen.has(a.icao)) return;
    if ((patternCount.get(patternId) ?? 0) >= MAX_PER_PATTERN) return;
    seen.add(a.icao);
    patternCount.set(patternId, (patternCount.get(patternId) ?? 0) + 1);
    actions.push(a);
  };

  /* 1. CRITICAL — multi-factor degradation (weather + thin manpower). The
        single highest-signal pattern for a duty manager. */
  const wxRisk = [...snapshot]
    .filter(
      (b) =>
        b.weather &&
        b.weather.windKt >= 18 &&
        b.current.manpowerCoverage < 0.78
    )
    .sort((a, b) => b.current.riskScore - a.current.riskScore);
  for (const b of wxRisk) {
    tryPush(
      {
        icao: b.station.icao,
        city: b.station.city,
        tone: "critical",
        icon: <Wind className="h-4 w-4" />,
        headline: `${b.station.city} — staffing thin under deteriorating wx`,
        body: `Crew at ${Math.round(b.current.manpowerCoverage * 100)}% with ${b.weather!.windKt}kt winds forecast. Pre-position duty dispatcher; confirm crosswind SOP with ramp lead.`,
        metric: `Risk ${b.current.riskScore} · crew ${Math.round(b.current.manpowerCoverage * 100)}%`,
        cta: "Pre-position",
      },
      "wx-crew"
    );
  }

  /* 2. CRITICAL — vendor SLA cluster. Procurement / vendor manager focus. */
  const vendorBreach = [...snapshot]
    .filter((b) => b.current.vendorBreaches7d >= 4)
    .sort((a, b) => b.current.vendorBreaches7d - a.current.vendorBreaches7d);
  for (const b of vendorBreach) {
    tryPush(
      {
        icao: b.station.icao,
        city: b.station.city,
        tone: "critical",
        icon: <AlertOctagon className="h-4 w-4" />,
        headline: `Vendor SLA cluster — ${b.station.city}`,
        body: `${b.current.vendorBreaches7d} breaches in the last 7 days. Escalate to procurement lead and trigger remediation review with the affected handler / caterer / fueler.`,
        metric: `${b.current.vendorBreaches7d} breaches · 7d`,
        cta: "Escalate",
      },
      "vendor-cluster"
    );
  }

  /* 3. WATCH — open safety items above tolerance. */
  const safety = [...snapshot]
    .filter((b) => b.current.openIncidents >= 2)
    .sort((a, b) => b.current.openIncidents - a.current.openIncidents);
  for (const b of safety) {
    tryPush(
      {
        icao: b.station.icao,
        city: b.station.city,
        tone: "watch",
        icon: <ShieldAlert className="h-4 w-4" />,
        headline: `${b.station.city} — ${b.current.openIncidents} open safety items`,
        body: `Quality & safety queue exceeds threshold. Schedule station standdown with the regional HSE lead and assign owners.`,
        metric: `${b.current.openIncidents} open · QHSE`,
        cta: "Schedule",
      },
      "safety-open"
    );
  }

  /* 4. WATCH — slot compliance dipping. */
  const slotDip = [...snapshot]
    .filter((b) => b.current.slotCompliance < 0.85 && b.current.turnsLast24h >= 3)
    .sort((a, b) => a.current.slotCompliance - b.current.slotCompliance);
  for (const b of slotDip) {
    tryPush(
      {
        icao: b.station.icao,
        city: b.station.city,
        tone: "watch",
        icon: <AlertTriangle className="h-4 w-4" />,
        headline: `On-time slipping — ${b.station.city}`,
        body: `Slot compliance at ${Math.round(b.current.slotCompliance * 100)}% (target ≥ 90%). Review tower sequencing and dispatch buffer with the ops supervisor.`,
        metric: `${Math.round(b.current.slotCompliance * 100)}% slot · ${b.current.turnsLast24h} turns`,
        cta: "Review",
      },
      "slot-dip"
    );
  }

  /* 5. OPPORTUNITY — spare capacity with healthy crew. Selling point for
        commercial / network-planning conversations. */
  const spare = [...snapshot]
    .filter(
      (b) =>
        b.current.turnsLast24h > 0 &&
        b.current.rampEfficiency < 0.7 &&
        b.current.manpowerCoverage > 0.85 &&
        b.current.status !== "critical"
    )
    .sort(
      (a, b) =>
        b.current.manpowerCoverage - b.current.rampEfficiency -
        (a.current.manpowerCoverage - a.current.rampEfficiency)
    );
  for (const b of spare) {
    tryPush(
      {
        icao: b.station.icao,
        city: b.station.city,
        tone: "opportunity",
        icon: <TrendingUp className="h-4 w-4" />,
        headline: `${b.station.city} can absorb additional movements`,
        body: `Ramp at ${Math.round(b.current.rampEfficiency * 100)}% with crew at ${Math.round(b.current.manpowerCoverage * 100)}%. Headroom for +18% movements with one additional dispatcher.`,
        metric: `+18% headroom · 1 dispatcher`,
        cta: "Evaluate",
      },
      "spare-capacity"
    );
  }

  /* 6. OPPORTUNITY — turnaround champion (fastest in network). */
  const fastest = [...snapshot]
    .filter(
      (b) =>
        b.current.turnsLast24h >= 5 &&
        b.current.avgTurnaroundMin < 45 &&
        b.current.status === "healthy"
    )
    .sort(
      (a, b) => a.current.avgTurnaroundMin - b.current.avgTurnaroundMin
    );
  for (const b of fastest) {
    tryPush(
      {
        icao: b.station.icao,
        city: b.station.city,
        tone: "opportunity",
        icon: <Lightbulb className="h-4 w-4" />,
        headline: `${b.station.city} — turnaround champion`,
        body: `Avg turnaround ${b.current.avgTurnaroundMin}m vs network mean. Document SOP and roll out to peer hubs in the region.`,
        metric: `${b.current.avgTurnaroundMin}m avg · best-in-network`,
        cta: "Capture SOP",
      },
      "turnaround-champ"
    );
  }

  /* 7. WATCH — manpower hot-spot (no other risk yet but coverage is thin). */
  const crewThin = [...snapshot]
    .filter(
      (b) =>
        b.current.manpowerCoverage < 0.72 &&
        !seen.has(b.station.icao) &&
        b.current.status !== "critical"
    )
    .sort(
      (a, b) => a.current.manpowerCoverage - b.current.manpowerCoverage
    );
  for (const b of crewThin) {
    tryPush(
      {
        icao: b.station.icao,
        city: b.station.city,
        tone: "watch",
        icon: <Users className="h-4 w-4" />,
        headline: `${b.station.city} crew coverage thin`,
        body: `Roster at ${Math.round(b.current.manpowerCoverage * 100)}% (target 85%). Cross-deck a dispatcher from the regional pool for the next two duty cycles.`,
        metric: `${Math.round(b.current.manpowerCoverage * 100)}% staffed`,
        cta: "Cross-deck",
      },
      "crew-thin"
    );
  }

  return actions;
}

/* ────────────────────────────────────────────────────────────────────────── */
/*  Component                                                                 */
/* ────────────────────────────────────────────────────────────────────────── */

export function ActionCards({ snapshot }: ActionCardsProps) {
  const actions = buildActions(snapshot);
  if (actions.length === 0) return null;

  const groups = {
    critical: actions.filter((a) => a.tone === "critical").length,
    watch: actions.filter((a) => a.tone === "watch").length,
    opportunity: actions.filter((a) => a.tone === "opportunity").length,
  };

  return (
    <section>
      <div className="flex items-center gap-3 mb-3 flex-wrap">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-jx-muted">
          Executive action cards
        </h2>
        <div className="flex items-center gap-1.5 text-[10px] font-mono">
          {groups.critical > 0 ? (
            <span className="text-jx-critical font-bold">
              ● {groups.critical} ESCALATE
            </span>
          ) : null}
          {groups.watch > 0 ? (
            <span className="text-jx-watch font-bold">
              ● {groups.watch} MONITOR
            </span>
          ) : null}
          {groups.opportunity > 0 ? (
            <span className="text-jx-healthy font-bold">
              ● {groups.opportunity} OPPORTUNITY
            </span>
          ) : null}
        </div>
        <div className="h-px flex-1 bg-jx-border" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {actions.map((a, i) => {
          const t = TONE_STYLES[a.tone];
          return (
            <Link
              key={i}
              href={`/stations/${a.icao}`}
              className={cn(
                /* Coloured-rail card.  `before:` creates a 4px left strip
                   that matches the action tone — the strongest visual cue
                   that these cards aren't all the same urgency. */
                "group relative block rounded-lg border transition-all",
                "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:rounded-l-lg",
                "pl-4 pr-4 py-3.5",
                "hover:-translate-y-px hover:shadow-md",
                t.surface,
                t.border,
                t.rail
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center justify-center h-6 w-6 rounded-full bg-white shadow-sm",
                      t.fg
                    )}
                  >
                    {a.icon}
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center px-1.5 py-0.5 rounded-sm text-[9px] font-bold tracking-[0.12em] uppercase",
                      t.pill
                    )}
                  >
                    {t.label}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-jx-subtle">
                  {a.icao}
                </span>
              </div>

              <div className="text-[13px] font-semibold text-jx-text leading-snug">
                {a.headline}
              </div>
              <p className="mt-1 text-[12px] text-jx-muted leading-relaxed">
                {a.body}
              </p>

              <div className="mt-2.5 pt-2.5 border-t border-jx-border/70 flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "inline-flex items-center font-mono text-[11px] font-semibold",
                    t.fg
                  )}
                >
                  {a.metric}
                </span>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider",
                    t.cta,
                    "group-hover:translate-x-0.5 transition-transform"
                  )}
                >
                  {a.cta}
                  <ArrowUpRight className="h-3 w-3" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
