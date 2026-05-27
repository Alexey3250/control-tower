"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SubScoreBars } from "./sub-score-bars";
import { WaterfallChart } from "./waterfall-chart";
import { DEFAULT_AIRPORT, DEFAULT_INPUTS, type CandidateAirport } from "./presets";
import { AirportSearch } from "./airport-search";
import { downloadFeasibilityPdf, downloadXlsx } from "@/lib/exports";
import { formatCurrency, formatNumber } from "@/lib/utils";
import type { FeasibilityInputs, FeasibilityResult } from "@/lib/types";

async function postFeasibility(
  inputs: FeasibilityInputs,
  candidate: { lat: number; lon: number }
): Promise<FeasibilityResult> {
  const res = await fetch("/api/feasibility", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ inputs, candidate }),
  });
  if (!res.ok) throw new Error("feasibility failed");
  return res.json();
}

export function FeasibilityStudio() {
  const [inputs, setInputs] = React.useState<FeasibilityInputs>(DEFAULT_INPUTS);
  const [candidate, setCandidate] =
    React.useState<CandidateAirport>(DEFAULT_AIRPORT);

  const { data, isFetching } = useQuery<FeasibilityResult>({
    queryKey: ["feasibility", inputs],
    queryFn: () =>
      postFeasibility(inputs, { lat: candidate.lat, lon: candidate.lon }),
    placeholderData: (prev) => prev,
  });

  function update<K extends keyof FeasibilityInputs>(
    k: K,
    v: FeasibilityInputs[K]
  ) {
    setInputs((s) => ({ ...s, [k]: v }));
  }

  function onAirportChange(a: CandidateAirport) {
    setCandidate(a);
    setInputs((s) => ({
      ...s,
      airportCode: a.code,
      city: a.city,
      country: a.country,
      region: a.region,
    }));
  }

  function exportToXlsx() {
    if (!data) return;
    const summary = [
      {
        Airport: data.inputs.airportCode,
        City: data.inputs.city,
        Country: data.inputs.country,
        Verdict: data.verdict,
        "Composite Score": data.compositeScore,
        "Setup Cost USD": data.financial.setupCostUsd,
        "Monthly Revenue USD": data.financial.monthlyRevenueUsd,
        "Monthly OpEx USD": data.financial.monthlyOpexUsd,
        "Monthly EBITDA USD": data.financial.monthlyEbitdaUsd,
        "Breakeven Months": data.financial.breakevenMonths,
        "3Y NPV USD": data.financial.threeYearNpvUsd,
        Headcount: data.financial.headcountTotal,
        "Cost / Turn USD": data.financial.costPerTurnUsd,
      },
    ];
    downloadXlsx(summary, `jetex-feasibility-${data.inputs.airportCode}`);
  }

  async function exportToPdf() {
    if (!data) return;
    await downloadFeasibilityPdf(data);
  }

  return (
    <div className="flex-1 grid grid-cols-1 xl:grid-cols-[420px_1fr] min-w-0">
      <aside className="border-r border-jx-border p-6 space-y-5 bg-jx-panel/40">
        <div>
          <div className="text-xs uppercase tracking-wider text-jx-muted">
            Candidate
          </div>
          <h2 className="font-display text-2xl text-jx-text mt-1">
            {candidate.city}, {candidate.country}
          </h2>
          <div className="text-xs text-jx-muted font-mono">
            {candidate.code} · {candidate.lat.toFixed(2)},{" "}
            {candidate.lon.toFixed(2)}
          </div>
        </div>

        <Field label="Airport" hint="OurAirports live search">
          <AirportSearch selected={candidate} onSelect={onAirportChange} />
        </Field>

        <Field
          label="Expected movements / month"
          hint={`${formatNumber(inputs.expectedMovementsMonth)} bizjet movements`}
        >
          <Slider
            min={60}
            max={1600}
            step={20}
            value={[inputs.expectedMovementsMonth]}
            onValueChange={([v]) => update("expectedMovementsMonth", v)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="FBO tier">
            <Select
              value={inputs.fboTier}
              onValueChange={(v) =>
                update("fboTier", v as FeasibilityInputs["fboTier"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Compact">Compact</SelectItem>
                <SelectItem value="Standard">Standard</SelectItem>
                <SelectItem value="Flagship">Flagship</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Staffing">
            <Select
              value={inputs.staffingModel}
              onValueChange={(v) =>
                update("staffingModel", v as FeasibilityInputs["staffingModel"])
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Lean">Lean</SelectItem>
                <SelectItem value="Standard">Standard</SelectItem>
                <SelectItem value="Premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <Field label="Service tier">
          <Select
            value={inputs.serviceTier}
            onValueChange={(v) =>
              update("serviceTier", v as FeasibilityInputs["serviceTier"])
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Standard">Standard</SelectItem>
              <SelectItem value="VIP">VIP</SelectItem>
              <SelectItem value="Ultra-VIP">Ultra-VIP</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field
          label="Fuel margin (USD / gal)"
          hint={`$${inputs.fuelMarginUsdGal.toFixed(2)}`}
        >
          <Slider
            min={0.4}
            max={3.5}
            step={0.05}
            value={[inputs.fuelMarginUsdGal]}
            onValueChange={([v]) => update("fuelMarginUsdGal", v)}
          />
        </Field>

        <Field
          label="Traffic growth (% / yr)"
          hint={`${inputs.trafficGrowthPct.toFixed(1)}%`}
        >
          <Slider
            min={-10}
            max={30}
            step={0.5}
            value={[inputs.trafficGrowthPct]}
            onValueChange={([v]) => update("trafficGrowthPct", v)}
          />
        </Field>

        <Field
          label="Vendor cost index"
          hint={`${inputs.vendorCostIndex.toFixed(2)}x baseline`}
        >
          <Slider
            min={0.5}
            max={2.0}
            step={0.05}
            value={[inputs.vendorCostIndex]}
            onValueChange={([v]) => update("vendorCostIndex", v)}
          />
        </Field>

        <Field label="Monthly rent (USD)">
          <Input
            type="number"
            value={inputs.rentMonthlyUsd}
            onChange={(e) =>
              update("rentMonthlyUsd", Number(e.target.value) || 0)
            }
          />
        </Field>

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={exportToPdf}
            disabled={!data}
            variant="outline"
            className="w-full"
          >
            Export PDF
          </Button>
          <Button
            onClick={exportToXlsx}
            disabled={!data}
            variant="gold"
            className="w-full"
          >
            Export XLSX
          </Button>
        </div>
      </aside>

      <section className="p-6 space-y-5 min-w-0">
        {data ? (
          <>
            <VerdictCard result={data} loading={isFetching} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Sub-scores</CardTitle>
                </CardHeader>
                <CardContent>
                  <SubScoreBars scores={data.subScores} />
                </CardContent>
              </Card>

              <Card className="lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Monthly cash waterfall</CardTitle>
                  <Badge variant="outline" className="font-mono">
                    {formatCurrency(data.financial.monthlyEbitdaUsd)} EBITDA
                  </Badge>
                </CardHeader>
                <CardContent>
                  <WaterfallChart data={data.financial.waterfall} />
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              <Card>
                <CardHeader>
                  <CardTitle>Headline financials</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Stat label="Setup cost" value={formatCurrency(data.financial.setupCostUsd)} />
                  <Stat label="Monthly revenue" value={formatCurrency(data.financial.monthlyRevenueUsd)} />
                  <Stat label="Monthly OpEx" value={formatCurrency(data.financial.monthlyOpexUsd)} />
                  <Stat
                    label="Breakeven"
                    value={
                      data.financial.breakevenMonths > 0
                        ? `${data.financial.breakevenMonths} months`
                        : "Not within model horizon"
                    }
                    tone={
                      data.financial.breakevenMonths > 0 &&
                      data.financial.breakevenMonths <= 36
                        ? "good"
                        : "bad"
                    }
                  />
                  <Stat
                    label="3-yr NPV @ 10%"
                    value={formatCurrency(data.financial.threeYearNpvUsd)}
                    tone={data.financial.threeYearNpvUsd > 0 ? "good" : "bad"}
                  />
                  <Stat
                    label="Cost / turn"
                    value={formatCurrency(data.financial.costPerTurnUsd)}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Headcount plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Stat
                    label="Total headcount"
                    value={String(data.financial.headcountTotal)}
                  />
                  {data.financial.headcountByRole.map((r) => (
                    <Stat key={r.role} label={r.role} value={String(r.count)} />
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Decision rationale</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <ul className="space-y-2">
                    {data.rationale.map((r, i) => (
                      <li
                        key={i}
                        className="flex gap-2 text-jx-muted leading-relaxed"
                      >
                        <Sparkles className="h-3.5 w-3.5 text-jx-gold mt-0.5 shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>

                  {data.conditions.length > 0 ? (
                    <div className="pt-3 border-t border-jx-border space-y-2">
                      <div className="text-[10px] uppercase tracking-wider text-jx-watch font-semibold flex items-center gap-1.5">
                        <AlertTriangle className="h-3 w-3" />
                        Conditions to upgrade
                      </div>
                      <ul className="space-y-1.5 text-xs text-jx-muted">
                        {data.conditions.map((c, i) => (
                          <li key={i} className="leading-relaxed">
                            · {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="text-xs text-jx-healthy flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Model returns Go without conditions.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="text-xs text-jx-muted">
              Weather-tolerability is derived from 2 years of Open-Meteo
              historical climate for the candidate coordinates. Financial model
              is illustrative — discount rate fixed at 10% annualised over 36
              months.
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="p-8 text-jx-muted text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 animate-pulse" /> Running model…
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  );
}

function VerdictCard({
  result,
  loading,
}: {
  result: FeasibilityResult;
  loading: boolean;
}) {
  const tone =
    result.verdict === "Go"
      ? "healthy"
      : result.verdict === "Watch"
        ? "watch"
        : "critical";
  return (
    <Card className="border-2 border-jx-border-strong">
      <CardContent className="p-6 flex flex-wrap items-center justify-between gap-6">
        <div>
          <div className="text-xs uppercase tracking-wider text-jx-muted">
            Recommendation
          </div>
          <div className="flex items-center gap-4 mt-1">
            <span
              className={
                tone === "healthy"
                  ? "font-display text-5xl text-jx-healthy"
                  : tone === "watch"
                    ? "font-display text-5xl text-jx-watch"
                    : "font-display text-5xl text-jx-critical"
              }
            >
              {result.verdict}
            </span>
            <div className="space-y-1">
              <div className="text-xs text-jx-muted">Composite score</div>
              <div className="font-mono text-2xl text-jx-text">
                {result.compositeScore}/100
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono">
            {result.inputs.fboTier} · {result.inputs.staffingModel}
          </Badge>
          <Badge variant="secondary" className="font-mono">
            {result.inputs.serviceTier}
          </Badge>
          {loading ? (
            <Badge variant="outline" className="font-mono">
              recalculating…
            </Badge>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        {hint ? (
          <span className="text-[10px] text-jx-gold font-mono">{hint}</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad";
}) {
  return (
    <div className="flex items-center justify-between text-sm py-1 border-b border-jx-border/60 last:border-0">
      <span className="text-jx-muted">{label}</span>
      <span
        className={
          tone === "good"
            ? "font-mono text-jx-healthy"
            : tone === "bad"
              ? "font-mono text-jx-critical"
              : "font-mono text-jx-text"
        }
      >
        {value}
      </span>
    </div>
  );
}
