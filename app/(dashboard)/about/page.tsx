import Link from "next/link";
import {
  Activity,
  Boxes,
  CircleDot,
  Database,
  ExternalLink,
  FileSpreadsheet,
  Layers,
  Plane,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react";
import { Topbar } from "@/components/shell/topbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { STATIONS } from "@/config/network";
import { FLEET } from "@/config/fleet";
import { BuilderCard } from "@/components/shell/builder-card";
import { BUILDER } from "@/config/builder";
import { LinkedInIcon, WhatsAppIcon } from "@/components/shell/builder-icons";

export const metadata = {
  title: "About · Jetex Control Tower",
  description:
    "Portfolio project: a decision-support control tower for an FBO network, built to demonstrate operations-analyst thinking against the Jetex job description.",
};

interface TechItem {
  label: string;
  detail: string;
}

const STACK: { group: string; items: TechItem[] }[] = [
  {
    group: "Framework & UI",
    items: [
      { label: "Next.js 16", detail: "App Router, React Server Components" },
      { label: "React 19 + TypeScript", detail: "Strict mode, no implicit any" },
      { label: "Tailwind CSS v4", detail: "Custom Jetex token palette" },
      { label: "shadcn/ui (local)", detail: "Re-themed primitives" },
      { label: "Lucide Icons", detail: "Operations iconography" },
    ],
  },
  {
    group: "Data & Visualisation",
    items: [
      { label: "TanStack Query", detail: "Polling, server-hydrated cache" },
      { label: "MapLibre GL JS", detail: "via react-map-gl + CARTO dark style" },
      { label: "Recharts", detail: "Trends, radars, waterfall, history" },
      { label: "Zod", detail: "Route handler validation" },
    ],
  },
  {
    group: "Exports & Engines",
    items: [
      { label: "SheetJS (xlsx)", detail: "Power-BI-style XLSX / CSV everywhere" },
      { label: "jsPDF", detail: "Network and feasibility PDF briefings" },
      { label: "Faker.js", detail: "Deterministic synthetic ops generator" },
      { label: "Custom risk engine", detail: "Weighted composite + simulator" },
    ],
  },
];

interface DataSource {
  source: string;
  origin: "Real" | "Synthetic";
  module: string;
  notes: string;
  url?: string;
}

const SOURCES: DataSource[] = [
  {
    source: "Station roster",
    origin: "Real",
    module: "All modules",
    notes:
      "Jetex destinations published on jetex.com — ICAO/IATA codes and coordinates from public airport databases. Service tiering is illustrative only.",
    url: "https://www.jetex.com/destinations/",
  },
  {
    source: "Live aircraft positions",
    origin: "Real",
    module: "Operations Map, Fleet Intelligence",
    notes:
      "OpenSky Network /states/all polled every 15s for a curated Jetex-related fleet (ICAO24 hex). Aircraft selection is best-effort from public registries.",
    url: "https://opensky-network.org/",
  },
  {
    source: "Recent flights & airport history",
    origin: "Real",
    module: "Aircraft drilldown",
    notes: "OpenSky /flights/aircraft endpoint, 7-day window.",
    url: "https://openskynetwork.github.io/opensky-api/rest.html",
  },
  {
    source: "Aviation weather (METAR / TAF)",
    origin: "Real",
    module: "Station drilldown",
    notes: "NOAA Aviation Weather Center text data API.",
    url: "https://aviationweather.gov/data/api/",
  },
  {
    source: "Historical weather profile",
    origin: "Real",
    module: "Feasibility Studio",
    notes: "Open-Meteo Historical reanalysis for candidate-airport coordinates.",
    url: "https://open-meteo.com/en/docs/historical-weather-api",
  },
  {
    source: "Worldwide airport autocomplete",
    origin: "Real",
    module: "Feasibility Studio",
    notes:
      "OurAirports CSV (~80k airports) — cached server-side and searched with custom scoring.",
    url: "https://ourairports.com/data/",
  },
  {
    source: "Station KPIs (turns, PAX, fuel, manpower, SLA, incidents, cost)",
    origin: "Synthetic",
    module: "All modules",
    notes:
      "Deterministic Faker-seeded generator modelled on public FBO workflows. Numbers are plausible but not real Jetex operating data.",
  },
  {
    source: "Station launch milestones",
    origin: "Synthetic",
    module: "Launch Tracker",
    notes:
      "Eight workstreams per launch with weighted readiness scoring and RAG state, written to illustrate the launch-oversight portion of the job description.",
  },
  {
    source: "Vendor scorecards",
    origin: "Synthetic",
    module: "Vendor Scorecard",
    notes: "Seven vendor categories, 12-week trends, contract values, SLA breaches.",
  },
];

const FEATURES = [
  {
    icon: Activity,
    title: "Network Overview",
    text: "KPI cards, executive action prompts, what-if risk-weight simulator, ranked station table with drilldown.",
  },
  {
    icon: Plane,
    title: "Operations Map",
    text: "MapLibre globe with tier-sized FBO pins, live aircraft positions, fading flight trails, weather overlay and active-destinations inference.",
  },
  {
    icon: Boxes,
    title: "Launch Tracker",
    text: "Per-station Gantt board across eight workstreams with weighted readiness score and overdue escalation.",
  },
  {
    icon: Target,
    title: "Feasibility Studio",
    text: "Airport autocomplete → Go / Watch / No-Go verdict with sub-scores, waterfall financial model and PDF briefing.",
  },
  {
    icon: ShieldCheck,
    title: "Vendor Scorecard",
    text: "Heatmap across seven categories with drill-into-trend modal and XLSX export.",
  },
  {
    icon: FileSpreadsheet,
    title: "Power BI-grade exports",
    text: "Every table exports to XLSX / CSV; the Overview and Feasibility briefs export to PDF.",
  },
];

const JD_MAP = [
  {
    jd: "Oversee operational performance across multiple locations",
    where: "Network Overview KPI deck + Operations Map",
  },
  {
    jd: "Monitor and analyse key operational KPIs",
    where: "Network Overview + Station Risk index + drilldowns",
  },
  {
    jd: "Lead operational oversight of new station launches, ensuring readiness prior to go-live",
    where: "Launch Tracker with weighted readiness score",
  },
  {
    jd: "Conduct operational feasibility studies (infrastructure, staffing, traffic, cost)",
    where: "Feasibility Studio + waterfall financial model",
  },
  {
    jd: "Manage and evaluate third-party vendor performance against SLAs",
    where: "Vendor Scorecard heatmap + trend modal",
  },
  {
    jd: "Power BI / Advanced Excel proficiency",
    where: "BI-style drilldown UX + XLSX / CSV / PDF exports on every screen",
  },
];

export default function AboutPage() {
  const regions = STATIONS.reduce<Record<string, number>>((acc, s) => {
    acc[s.region] = (acc[s.region] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex-1 flex flex-col min-w-0">
      <Topbar
        title="About this project"
        subtitle="Portfolio demonstration · concept only · not affiliated with Jetex Flight Support"
        meta={
          <Badge variant="gold" className="font-mono tracking-[0.18em]">
            PORTFOLIO
          </Badge>
        }
      />

      <div className="flex-1 p-4 md:p-6 space-y-5 md:space-y-6 max-w-[1200px] w-full mx-auto">
        {/* Builder hero — first thing recruiters and hiring managers see when
            they land on /about. Photo + name + LinkedIn + WhatsApp + Dubai
            phone, all tap-friendly. */}
        <BuilderCard variant="hero" />

        {/* Project hero */}
        <section className="rounded-lg border border-jx-border bg-white p-6 md:p-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-jx-orange">
              <Sparkles className="h-3.5 w-3.5" />
              <span className="text-[11px] uppercase tracking-[0.22em] font-semibold">
                Built for the Operations Analyst role at Jetex
              </span>
            </div>
            <h2 className="text-xl md:text-2xl text-jx-text leading-snug max-w-3xl font-semibold">
              A decision-support control tower modelled on FBO network ops —
              which station needs attention, why, and what should we do about
              it.
            </h2>
            <p className="text-sm text-jx-muted max-w-3xl leading-relaxed">
              Themed against the public{" "}
              <a
                href="https://www.jetex.com/"
                target="_blank"
                rel="noreferrer"
                className="text-jx-orange hover:underline"
              >
                Jetex
              </a>{" "}
              brand. Station roster mirrors the {STATIONS.length} destinations
              published on jetex.com across {Object.keys(regions).length}{" "}
              regions. Live aircraft, weather and airport data come from public
              APIs; internal operational KPIs are deterministic synthetic data,
              labelled as such.
            </p>
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <Button asChild variant="gold">
                <Link href="/">Open Network Overview</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/map">View Live Operations Map</Link>
              </Button>
              <Button asChild variant="outline">
                <a
                  href="https://www.jetex.com/destinations/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Jetex destinations
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* At a glance */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatTile label="Destinations modelled" value={STATIONS.length} />
          <StatTile label="Regions covered" value={Object.keys(regions).length} />
          <StatTile
            label="Aircraft tracked"
            value={FLEET.length}
            hint="Live OpenSky polling"
          />
          <StatTile label="Modules shipped" value={6} hint="Plus drilldowns" />
        </section>

        {/* Modules */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-jx-gold" />
              What you can do here
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="rounded-md border border-jx-border bg-jx-panel/40 p-4 space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-jx-gold" />
                    <div className="text-sm font-semibold text-jx-text">
                      {f.title}
                    </div>
                  </div>
                  <p className="text-xs text-jx-muted leading-relaxed">
                    {f.text}
                  </p>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* JD mapping */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-4 w-4 text-jx-gold" />
              Mapped to the Operations Analyst JD
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/2">Job-description signal</TableHead>
                  <TableHead>Where it shows up in this dashboard</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {JD_MAP.map((row) => (
                  <TableRow key={row.jd}>
                    <TableCell className="text-jx-text">{row.jd}</TableCell>
                    <TableCell className="text-jx-muted">{row.where}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Tech stack */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Boxes className="h-4 w-4 text-jx-gold" />
              Tech stack
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STACK.map((group) => (
              <div key={group.group} className="space-y-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-jx-gold">
                  {group.group}
                </div>
                <ul className="space-y-2">
                  {group.items.map((item) => (
                    <li key={item.label} className="flex items-start gap-2 text-sm">
                      <CircleDot className="h-3 w-3 mt-1 text-jx-gold-soft shrink-0" />
                      <div>
                        <div className="text-jx-text">{item.label}</div>
                        <div className="text-xs text-jx-muted">{item.detail}</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Data sources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-4 w-4 text-jx-gold" />
              Data provenance · real vs synthetic
            </CardTitle>
            <div className="text-xs text-jx-muted">
              Real FBO operating data is proprietary. Every figure in this
              dashboard is either pulled from a clearly-named public source or
              generated synthetically and labelled as such.
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Origin</TableHead>
                  <TableHead>Where used</TableHead>
                  <TableHead>Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {SOURCES.map((s) => (
                  <TableRow key={s.source}>
                    <TableCell className="text-jx-text font-medium">
                      {s.url ? (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          className="hover:text-jx-gold transition-colors inline-flex items-center gap-1"
                        >
                          {s.source}
                          <ExternalLink className="h-3 w-3 opacity-60" />
                        </a>
                      ) : (
                        s.source
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={s.origin === "Real" ? "healthy" : "watch"}
                        className="font-mono"
                      >
                        {s.origin}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-jx-muted text-sm">
                      {s.module}
                    </TableCell>
                    <TableCell className="text-jx-muted text-xs max-w-[520px]">
                      {s.notes}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Network coverage */}
        <Card>
          <CardHeader>
            <CardTitle>Modelled network coverage</CardTitle>
            <div className="text-xs text-jx-muted">
              {STATIONS.length} stations across {Object.keys(regions).length}{" "}
              regions, mirroring the published Jetex destination list (Dubai HQ +
              global FBOs).
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {Object.entries(regions).map(([region, count]) => (
              <div
                key={region}
                className="rounded-md border border-jx-border bg-jx-panel/50 px-3 py-3"
              >
                <div className="text-[10px] uppercase tracking-[0.18em] text-jx-gold">
                  {region}
                </div>
                <div className="font-display text-2xl text-jx-text">{count}</div>
                <div className="text-[11px] text-jx-muted">stations</div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Disclaimers + author */}
        <Card>
          <CardHeader>
            <CardTitle>Important disclaimers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-jx-muted">
            <p>
              This is an independent portfolio project. It is{" "}
              <span className="text-jx-text">not affiliated with, endorsed by, or operated by Jetex Flight Support</span>.
              The Jetex name, logo and corporate styling are used only as a
              demonstration of brand fluency for a recruiting context.
            </p>
            <p>
              All operational KPIs (turns, PAX, fuel, manpower coverage, vendor
              SLAs, incidents, cost variance, launch milestones) are{" "}
              <span className="text-jx-text">synthetic</span> and generated
              deterministically from a Faker.js seed. They are designed to be
              realistic in shape and distribution, not to represent actual Jetex
              operating performance.
            </p>
            <p>
              Real components — aircraft positions, METAR/TAF, historical weather
              and airport metadata — are pulled live from clearly-attributed
              public APIs and are subject to those providers&apos; rate limits and
              availability.
            </p>
          </CardContent>
        </Card>

        {/* Hire-me CTA — explicit, ungated, two big buttons. */}
        <Card className="border-jx-orange/40 bg-linear-to-br from-white to-jx-orange-tint/30">
          <CardHeader>
            <CardTitle className="text-jx-text text-base">
              Interested? Let&apos;s talk.
            </CardTitle>
            <div className="text-xs text-jx-muted">
              I&apos;m {BUILDER.name}, based in {BUILDER.location}, applying for
              the Operations Analyst role at Jetex. Easiest ways to reach me:
            </div>
          </CardHeader>
          <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button asChild className="bg-[#0a66c2] hover:bg-[#0856a8] text-white">
                <a
                  href={BUILDER.links.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <LinkedInIcon size={14} /> Open LinkedIn profile
                </a>
              </Button>
              <Button asChild className="bg-[#25d366] hover:bg-[#1ebe5d] text-white">
                <a
                  href={BUILDER.links.whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  <WhatsAppIcon size={14} /> WhatsApp · {BUILDER.links.phoneDisplay}
                </a>
              </Button>
              <Button asChild variant="outline">
                <a href={`tel:${BUILDER.links.phoneE164}`}>
                  Call {BUILDER.links.phoneDisplay}
                </a>
              </Button>
            </div>
            <div className="text-[11px] text-jx-muted leading-relaxed text-right max-w-xs">
              CV available on request.
              <br />
              Source code &amp; live demo links on LinkedIn.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: number | string;
  hint?: string;
}) {
  return (
    <div className="rounded-md border border-jx-border bg-jx-panel/50 p-4">
      <div className="text-[10px] uppercase tracking-[0.18em] text-jx-gold">
        {label}
      </div>
      <div className="font-display text-3xl text-jx-text mt-1">{value}</div>
      {hint ? (
        <div className="text-[11px] text-jx-muted mt-0.5">{hint}</div>
      ) : null}
    </div>
  );
}
