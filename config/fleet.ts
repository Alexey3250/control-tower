/**
 * Tracked aircraft roster for the Live Operations Map.
 *
 * Sourced from the public-data seed list in `deep-research-report.md`, which
 * combines:
 *
 *   - **Core Jetex-marketed aircraft** explicitly marketed as Jetex charter
 *     on JetVIP (10 aircraft).
 *   - **Additional Jetex-related candidates** (inferred Jetex LLC US tails,
 *     marketplace-listed aircraft).
 *   - **DWC ecosystem supplement** — DWC-based business jets that aren't
 *     demonstrably Jetex-operated but appear on JetVIP's DWC airport page.
 *     Useful to keep the map alive around the Dubai hub.
 *
 * The dashboard intentionally separates `jetexRelationship` (the marketing
 * claim or registry inference) from `broadcastOperator` (what Flightradar24
 * actually labels the aircraft), because the two often disagree. Each row
 * carries a `confidence` rating and a `uiStatus` for the rendering layer.
 *
 * ICAO24 hex codes (6 lowercase chars) are queried against the OpenSky
 * Network public API via `lib/data/opensky.ts`.
 */

export type FleetConfidence = "high" | "medium" | "low_medium" | "low";

export type FleetLayer =
  | "core"
  | "additional"
  | "dwc-ecosystem"
  /** Always-on demo flights from `lib/sim/routes.ts`. Not real telemetry. */
  | "simulated";

/**
 * Rendering-layer UI status, sourced from the deep-research report. Maps to
 * how the aircraft card should be labelled when its live telemetry differs
 * from its marketing identity.
 */
export type FleetUiStatus =
  | "live"
  | "coverage-limited"
  | "anonymised"
  | "identifier-changed"
  | "historical-only"
  | "relationship-inferred"
  /** Synthetic flight, deterministically interpolated along a real route. */
  | "simulated";

export interface FleetAircraft {
  icao24: string;
  tail: string;
  typeCode: string;
  model: string;
  /** Marketing / management relationship to Jetex (public claim). */
  jetexRelationship: string;
  /** What public trackers (FR24) label the aircraft. May differ. */
  broadcastOperator?: string;
  homeBaseHint?: string;
  layer: FleetLayer;
  confidence: FleetConfidence;
  uiStatus: FleetUiStatus;
  /** Free-form note for the drilldown UI. */
  note?: string;
}

export const FLEET: FleetAircraft[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // Core Jetex-marketed aircraft (JetVIP "Jetex" operator listings).
  // ─────────────────────────────────────────────────────────────────────────
  {
    icao24: "4d23fe",
    tail: "9H-TOP",
    typeCode: "GLEX",
    model: "Bombardier Global 6000",
    jetexRelationship: "Marketed as Jetex on JetVIP",
    broadcastOperator: "Avcon Jet Malta",
    homeBaseHint: "Dubai (DWC)",
    layer: "core",
    confidence: "medium",
    uiStatus: "coverage-limited",
    note: "FR24 aircraft page resolves; broadcast operator differs from charter relationship.",
  },
  {
    icao24: "3c86c7",
    tail: "D-BAVG",
    typeCode: "C750",
    model: "Cessna Citation X",
    jetexRelationship: "Marketed as Jetex on JetVIP",
    broadcastOperator: "Avcon Jet",
    homeBaseHint: "Dubai (DWC)",
    layer: "core",
    confidence: "medium",
    uiStatus: "coverage-limited",
  },
  {
    icao24: "4850a1",
    tail: "P4-BFH",
    typeCode: "GLEX",
    model: "Bombardier Global Express",
    jetexRelationship: "Listed as Jetex-operated on JetVIP",
    broadcastOperator: "Bestfly Aruba",
    homeBaseHint: "Luanda (LAD)",
    layer: "core",
    confidence: "medium",
    uiStatus: "coverage-limited",
  },
  {
    icao24: "4850c9",
    tail: "P4-BFK",
    typeCode: "GLEX",
    model: "Bombardier Global Express",
    jetexRelationship: "Listed as Jetex-operated on JetVIP",
    broadcastOperator: "Bestfly Aruba",
    homeBaseHint: "Dubai (DWC)",
    layer: "core",
    confidence: "medium",
    uiStatus: "coverage-limited",
  },
  {
    icao24: "4844b1",
    tail: "P4-BFL",
    typeCode: "GLF4",
    model: "Gulfstream G450",
    jetexRelationship: "Listed as Jetex-operated on JetVIP",
    broadcastOperator: "Bestfly Aruba",
    homeBaseHint: "Dubai (DWC)",
    layer: "core",
    confidence: "medium",
    uiStatus: "coverage-limited",
  },
  {
    icao24: "4850c7",
    tail: "P4-BFR",
    typeCode: "GLF5",
    model: "Gulfstream G550",
    jetexRelationship: "Seller Jetex; Jetex-operated on JetVIP",
    broadcastOperator: "Bestfly Aruba",
    homeBaseHint: "Dubai (DWC)",
    layer: "core",
    confidence: "medium",
    uiStatus: "coverage-limited",
  },
  {
    icao24: "484345",
    tail: "P4-BFW",
    typeCode: "GLEX",
    model: "Bombardier Global Express",
    jetexRelationship: "Listed as Jetex-operated on JetVIP",
    broadcastOperator: "Bestfly Aruba",
    homeBaseHint: "Porto (OPO)",
    layer: "core",
    confidence: "medium",
    uiStatus: "coverage-limited",
  },
  {
    icao24: "48412f",
    tail: "P4-BFX",
    typeCode: "GLF4",
    model: "Gulfstream G450",
    jetexRelationship: "Listed as Jetex-operated on JetVIP",
    broadcastOperator: "Bestfly Aruba",
    homeBaseHint: "Dubai (DWC)",
    layer: "core",
    confidence: "medium",
    uiStatus: "coverage-limited",
  },
  {
    icao24: "48412d",
    tail: "P4-TUNA",
    typeCode: "GLEX",
    model: "Bombardier Global Express XRS",
    jetexRelationship: "Listed as Jetex-operated on JetVIP",
    broadcastOperator: "Bestfly Aruba",
    homeBaseHint: "Luanda (LAD)",
    layer: "core",
    confidence: "medium",
    uiStatus: "coverage-limited",
  },
  {
    icao24: "469d41",
    tail: "SX-GJA",
    typeCode: "GLF6",
    model: "Gulfstream G650ER",
    jetexRelationship: "Listed as Jetex-operated on JetVIP",
    broadcastOperator: "GainJet Aviation",
    homeBaseHint: "Dubai (DWC)",
    layer: "core",
    confidence: "medium",
    uiStatus: "coverage-limited",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Additional Jetex-related candidates (inferred Jetex LLC US tails,
  // marketplace-listed aircraft).
  // ─────────────────────────────────────────────────────────────────────────
  {
    icao24: "aa7f8c",
    tail: "N776CJ",
    typeCode: "CL30",
    model: "Bombardier Challenger 300",
    jetexRelationship: "SkyAccess shows Jetex with one CL30; FAA match",
    broadcastOperator: "Jet Linx Aviation",
    homeBaseHint: "US charter",
    layer: "additional",
    confidence: "medium",
    uiStatus: "relationship-inferred",
    note: "Type-match inference; current broadcast operator differs.",
  },
  {
    icao24: "a7d30a",
    tail: "N603GR",
    typeCode: "LJ60",
    model: "Bombardier Learjet 60",
    jetexRelationship: "SkyAccess shows Jetex with one LJ60; FAA match",
    homeBaseHint: "US charter",
    layer: "additional",
    confidence: "medium",
    uiStatus: "relationship-inferred",
  },
  {
    icao24: "a99680",
    tail: "N717EP",
    typeCode: "CL35",
    model: "Bombardier Challenger 350",
    jetexRelationship: "Listed under Jetex LLC fleet on Victor / VirtualHangar",
    homeBaseHint: "Rochester / US Northeast",
    layer: "additional",
    confidence: "medium",
    uiStatus: "anonymised",
    note: "Tracking unavailable at owner/operator request on some platforms.",
  },
  {
    icao24: "a09259",
    tail: "N136JX",
    typeCode: "LJ60",
    model: "Bombardier Learjet 60",
    jetexRelationship: "Listed under Jetex LLC fleet on Victor",
    homeBaseHint: "US East Coast",
    layer: "additional",
    confidence: "medium",
    uiStatus: "live",
    note: "Strong recent public activity (GSP/TMB/CAE/SAV/TEB/IAD).",
  },
  {
    icao24: "4850ab",
    tail: "P4-BFM",
    typeCode: "CL60",
    model: "Bombardier Challenger 605",
    jetexRelationship: "Jettly markets as 'operated by Jetex'",
    homeBaseHint: "Dubai (DWC)",
    layer: "additional",
    confidence: "low_medium",
    uiStatus: "coverage-limited",
  },
  {
    icao24: "00a092",
    tail: "ZS-MIB",
    typeCode: "E145",
    model: "Embraer ERJ-145LR",
    jetexRelationship:
      "ATM Jet labels 'Operated by Jetex / Sahara African Aviation'",
    broadcastOperator: "Sahara African Aviation",
    homeBaseHint: "Dubai (DWC)",
    layer: "additional",
    confidence: "low_medium",
    uiStatus: "live",
    note: "Recent DWC↔Iraq VIP utility sectors visible.",
  },
  {
    icao24: "0d0a45",
    tail: "XA-DON",
    typeCode: "H25B",
    model: "Hawker 850XP",
    jetexRelationship: "Luxury Aircraft Solutions markets as 'Operated by JetEx'",
    homeBaseHint: "Mexico",
    layer: "additional",
    confidence: "low",
    uiStatus: "coverage-limited",
  },
  {
    icao24: "a7198f",
    tail: "N557BK",
    typeCode: "LJ31",
    model: "Bombardier Learjet 31A",
    jetexRelationship: "Historically listed under Jetex LLC on Victor / VirtualHangar",
    homeBaseHint: "US Northeast",
    layer: "additional",
    confidence: "low",
    uiStatus: "identifier-changed",
    note: "FAA registry now shows the N-number as reserved / cancelled. Treated as identifier drift, not a current live-map candidate.",
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DWC ecosystem supplement — DWC-based business jets surfaced on JetVIP's
  // DWC airport page. Likely to appear in a Jetex Dubai FBO context.
  // ─────────────────────────────────────────────────────────────────────────
  {
    icao24: "8966ca",
    tail: "A6-AFC",
    typeCode: "GLEX",
    model: "Bombardier Global Express XRS",
    jetexRelationship: "DWC-based on JetVIP airport page",
    homeBaseHint: "Dubai (DWC)",
    layer: "dwc-ecosystem",
    confidence: "low_medium",
    uiStatus: "coverage-limited",
  },
  {
    icao24: "896268",
    tail: "A6-FLH",
    typeCode: "GLF4",
    model: "Gulfstream G450",
    jetexRelationship: "DWC-based on JetVIP airport page",
    homeBaseHint: "Dubai (DWC)",
    layer: "dwc-ecosystem",
    confidence: "low_medium",
    uiStatus: "coverage-limited",
  },
  {
    icao24: "4d22a7",
    tail: "9H-BGK",
    typeCode: "CL85",
    model: "Bombardier Challenger 850",
    jetexRelationship: "DWC-based on JetVIP airport page",
    broadcastOperator: "Blue Square Aviation",
    homeBaseHint: "Dubai (DWC)",
    layer: "dwc-ecosystem",
    confidence: "low_medium",
    uiStatus: "coverage-limited",
  },
  {
    icao24: "50016b",
    tail: "T7-KBI",
    typeCode: "CL60",
    model: "Bombardier Challenger 605",
    jetexRelationship: "DWC-based on JetVIP airport page",
    broadcastOperator: "Falcon Luxe San Marino",
    homeBaseHint: "Dubai (DWC)",
    layer: "dwc-ecosystem",
    confidence: "low_medium",
    uiStatus: "coverage-limited",
  },
  {
    icao24: "0101e5",
    tail: "SU-SML",
    typeCode: "C680",
    model: "Cessna Citation Sovereign",
    jetexRelationship: "DWC-based on JetVIP airport page",
    broadcastOperator: "Smart Aviation",
    homeBaseHint: "Cairo / DWC",
    layer: "dwc-ecosystem",
    confidence: "low_medium",
    uiStatus: "live",
    note: "Public activity across DWC, Sharm, Europe and MENA.",
  },
  {
    icao24: "0100fe",
    tail: "SU-SMD",
    typeCode: "C680",
    model: "Cessna Citation Sovereign",
    jetexRelationship: "DWC-based on JetVIP airport page",
    broadcastOperator: "Smart Aviation",
    homeBaseHint: "Cairo / DWC",
    layer: "dwc-ecosystem",
    confidence: "low_medium",
    uiStatus: "coverage-limited",
  },
];

export const FLEET_LAYERS: { id: FleetLayer; label: string; description: string }[] =
  [
    {
      id: "core",
      label: "Core Jetex-marketed",
      description: "Charter-listed as Jetex on public marketplaces",
    },
    {
      id: "additional",
      label: "Additional Jetex-related",
      description: "Jetex LLC US fleet + marketplace 'operated by Jetex' listings",
    },
    {
      id: "dwc-ecosystem",
      label: "DWC ecosystem",
      description: "DWC-based business jets surfaced via JetVIP DWC airport page",
    },
    {
      id: "simulated",
      label: "Simulated demo",
      description:
        "Always-on demo flights flying real DWC routes (MIA, IBZ, PEK) — synthetic data, not real telemetry",
    },
  ];

export const FLEET_UI_STATUS_LABELS: Record<
  FleetUiStatus,
  { label: string; description: string }
> = {
  live: {
    label: "Live",
    description: "Current position returned from OpenSky within freshness window",
  },
  "coverage-limited": {
    label: "Coverage limited",
    description:
      "Aircraft resolves on public trackers but no fresh live position in poll window",
  },
  anonymised: {
    label: "Anonymised",
    description:
      "PIA / owner-requested suppression — public identifier intentionally obscured",
  },
  "identifier-changed": {
    label: "Identifier changed",
    description:
      "Registry state has changed; historical tail is not safe to rely on for the live map",
  },
  "historical-only": {
    label: "Historical only",
    description: "Only past-flight summaries are available",
  },
  "relationship-inferred": {
    label: "Relationship inferred",
    description:
      "No direct Jetex page names the aircraft; type-match or fleet-listing inference",
  },
  simulated: {
    label: "Simulated demo",
    description:
      "Synthetic flight, deterministically interpolated along a real DWC route — not OpenSky telemetry",
  },
};
