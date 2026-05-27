"use client";

import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { CandidateAirport } from "./presets";

interface AirportSearchResult {
  ident: string;
  iata: string | null;
  name: string;
  type: string;
  city: string;
  country: string;
  region: CandidateAirport["region"];
  lat: number;
  lon: number;
  label: string;
}

async function searchAirports(q: string): Promise<AirportSearchResult[]> {
  if (q.trim().length < 2) return [];
  const res = await fetch(
    `/api/airports/search?q=${encodeURIComponent(q)}&limit=10`,
    { cache: "no-store" }
  );
  if (!res.ok) return [];
  const json = (await res.json()) as { results: AirportSearchResult[] };
  return json.results;
}

export function AirportSearch({
  selected,
  onSelect,
}: {
  selected: CandidateAirport;
  onSelect: (airport: CandidateAirport) => void;
}) {
  const [query, setQuery] = React.useState(selected.label);
  const [open, setOpen] = React.useState(false);

  const { data = [], isFetching } = useQuery({
    queryKey: ["airport-search", query],
    queryFn: () => searchAirports(query),
    enabled: open && query.trim().length >= 2,
    staleTime: 60_000,
  });

  function choose(airport: AirportSearchResult) {
    const next: CandidateAirport = {
      code: airport.ident,
      label: airport.label,
      city: airport.city,
      country: airport.country,
      region: airport.region,
      lat: airport.lat,
      lon: airport.lon,
    };
    setQuery(airport.label);
    setOpen(false);
    onSelect(next);
  }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-jx-muted" />
        <Input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="pl-9"
          placeholder="Search airport, city, ICAO, IATA..."
        />
      </div>

      {open && query.trim().length >= 2 ? (
        <div className="absolute z-40 mt-1 max-h-80 w-full overflow-y-auto rounded-md border border-jx-border bg-jx-elev shadow-2xl">
          {isFetching ? (
            <div className="px-3 py-2 text-xs text-jx-muted">Searching…</div>
          ) : data.length ? (
            data.map((airport) => (
              <button
                key={`${airport.ident}-${airport.iata ?? ""}`}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(airport)}
                className="w-full px-3 py-2 text-left hover:bg-jx-panel transition-colors border-b border-jx-border/50 last:border-0"
              >
                <div className="text-sm text-jx-text">{airport.label}</div>
                <div className="text-[11px] text-jx-muted font-mono">
                  {airport.ident}
                  {airport.iata ? ` · ${airport.iata}` : ""} · {airport.country} ·{" "}
                  {airport.region}
                </div>
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-xs text-jx-muted">
              No airports found.
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
