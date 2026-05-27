import { mkdirSync, writeFileSync } from "node:fs";

const outDir = new URL("../data/synthetic/", import.meta.url);
mkdirSync(outDir, { recursive: true });

// Representative subset of the Jetex destination roster — used to render
// example CSVs that recruiters can open in Excel / Power BI. The full list of
// stations rendered in the live app lives in config/network.ts.
const stations = [
  ["OMDB", "Dubai DXB (Global HQ)", "Middle East"],
  ["OMDW", "Dubai DWC", "Middle East"],
  ["OMAA", "Abu Dhabi", "Middle East"],
  ["LFPB", "Paris Le Bourget", "Europe"],
  ["EGKB", "London Biggin Hill", "Europe"],
  ["LIRA", "Rome Ciampino", "Europe"],
  ["KOPF", "Miami-Opa Locka", "Americas"],
  ["RJTT", "Tokyo Haneda", "Asia Pacific"],
];

function csv(name, header, rows) {
  writeFileSync(
    new URL(name, outDir),
    [header.join(","), ...rows.map((row) => row.join(","))].join("\n") + "\n"
  );
}

csv(
  "station_daily_kpis.csv",
  [
    "date",
    "icao",
    "station",
    "region",
    "turns",
    "pax",
    "avg_turnaround_min",
    "slot_compliance_pct",
    "ramp_efficiency_pct",
    "fuel_uplift_gal",
  ],
  /* Calibrated to realistic FBO volumes for the Jetex network — hub fields
     (DXB / DWC / LBG / BQH) see ~12–22 movements/day, regional fields ~1–4.
     Pax per turn 3–7, fuel per turn 950–2200 gal. */
  stations.flatMap(([icao, station, region], si) =>
    Array.from({ length: 14 }, (_, i) => {
      const day = new Date(Date.UTC(2026, 4, 13 + i)).toISOString().slice(0, 10);
      const turns = Math.max(2, 6 + (si % 4) * 4 + (i % 3));
      return [
        day,
        icao,
        station,
        region,
        turns,
        turns * (4 + (si % 3)),
        42 + (si % 6) + (i % 3),
        91 - (si % 5),
        68 + (si % 9),
        turns * (950 + si * 80),
      ];
    })
  )
);

csv(
  "turnaround_events.csv",
  ["event_id", "timestamp", "icao", "tail", "phase", "sla_min", "actual_min", "status"],
  stations.flatMap(([icao], si) =>
    ["arrival", "passenger_transfer", "fueling", "catering", "permits", "departure"].map(
      (phase, i) => [
        `T${si + 1}${i + 1}`,
        `2026-05-${String(20 + (i % 7)).padStart(2, "0")}T${String(8 + i).padStart(
          2,
          "0"
        )}:00:00Z`,
        icao,
        ["P4-BFX", "9H-TOP", "D-BAVG", "P4-BFR"][i % 4],
        phase,
        30 + i * 10,
        28 + i * 12 + (si % 3),
        i % 4 === 0 ? "missed" : "met",
      ]
    )
  )
);

csv(
  "vendor_sla.csv",
  ["week", "icao", "vendor", "category", "sla_target_pct", "actual_pct", "breaches"],
  stations.map(([icao], i) => [
    "2026-W21",
    icao,
    ["Falcon Fuelers", "Royal Galley", "Apex Ground Services", "Prestige Cars"][
      i % 4
    ],
    ["fueling", "catering", "ground_handling", "transport"][i % 4],
    95,
    88 + (i % 11),
    i % 5,
  ])
);

csv(
  "staffing_roster.csv",
  ["date", "icao", "shift", "required_staff", "scheduled_staff", "coverage_pct"],
  stations.flatMap(([icao], i) =>
    ["AM", "PM", "NOC"].map((shift, j) => {
      const required = 10 + i + j;
      const scheduled = required - ((i + j) % 3);
      return [
        "2026-05-27",
        icao,
        shift,
        required,
        scheduled,
        Math.round((scheduled / required) * 100),
      ];
    })
  )
);

csv(
  "incident_log.csv",
  ["incident_id", "date", "icao", "severity", "category", "status", "summary"],
  stations.map(([icao], i) => [
    `I-${String(i + 1).padStart(3, "0")}`,
    "2026-05-26",
    icao,
    ["low", "medium", "high"][i % 3],
    ["safety", "quality", "compliance"][i % 3],
    i % 4 === 0 ? "open" : "closed",
    `"Synthetic ${["ramp", "catering", "permit"][i % 3]} workflow exception"`,
  ])
);

csv(
  "station_costs.csv",
  ["month", "icao", "budget_usd", "actual_usd", "variance_pct", "largest_driver"],
  stations.map(([icao], i) => {
    const budget = 420000 + i * 35000;
    const actual = budget * (0.94 + i * 0.018);
    return [
      "2026-05",
      icao,
      Math.round(budget),
      Math.round(actual),
      (((actual - budget) / budget) * 100).toFixed(1),
      ["overtime", "fuel handling", "vendor surcharge", "maintenance"][i % 4],
    ];
  })
);

csv(
  "launch_readiness_checklist.csv",
  ["icao", "station", "workstream", "weight", "progress_pct", "rag", "owner"],
  ["permits", "staffing", "equipment", "it", "training", "trial_ops", "regulatory", "go_live"].flatMap(
    (workstream, i) =>
      ["EGGW", "LSGG", "OEJN"].map((icao, j) => [
        icao,
        { EGGW: "London Luton", LSGG: "Geneva", OEJN: "Jeddah" }[icao],
        workstream,
        [18, 14, 16, 10, 10, 12, 10, 10][i],
        Math.max(25, 92 - i * 6 - j * 9),
        i + j > 8 ? "red" : i + j > 5 ? "amber" : "green",
        ["Ops Readiness", "People", "Procurement", "Technology"][i % 4],
      ])
  )
);

console.log(`Synthetic CSVs written to ${outDir.pathname}`);
