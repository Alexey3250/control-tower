import "server-only";
import type { Region } from "@/lib/types";

const AIRPORTS_CSV =
  "https://davidmegginson.github.io/ourairports-data/airports.csv";

export interface AirportSearchResult {
  ident: string;
  iata: string | null;
  name: string;
  type: string;
  city: string;
  country: string;
  region: Region;
  lat: number;
  lon: number;
  label: string;
}

interface AirportRow {
  ident: string;
  type: string;
  name: string;
  latitude_deg: string;
  longitude_deg: string;
  continent: string;
  iso_country: string;
  municipality: string;
  iata_code: string;
}

function parseCsvLine(line: string) {
  const out: string[] = [];
  let cur = "";
  let quoted = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (c === "," && !quoted) {
      out.push(cur);
      cur = "";
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

function continentToRegion(continent: string, country: string): Region {
  const middleEast = new Set([
    "AE",
    "SA",
    "QA",
    "OM",
    "BH",
    "KW",
    "JO",
    "LB",
    "IQ",
    "IR",
    "IL",
    "YE",
    "SY",
  ]);
  if (middleEast.has(country)) return "Middle East";
  if (continent === "EU") return "Europe";
  if (continent === "AF") return "Africa";
  if (continent === "AS" || continent === "OC") return "Asia Pacific";
  return "Americas";
}

let airportCache: AirportSearchResult[] | null = null;

async function loadAirports() {
  if (airportCache) return airportCache;

  const res = await fetch(AIRPORTS_CSV, {
    next: { revalidate: 86_400, tags: ["ourairports"] },
  });
  if (!res.ok) {
    console.warn(`[ourairports] fetch failed ${res.status}`);
    airportCache = [];
    return airportCache;
  }

  const csv = await res.text();
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const header = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map((line) => {
    const cols = parseCsvLine(line);
    return Object.fromEntries(header.map((key, i) => [key, cols[i] ?? ""]));
  }) as unknown as AirportRow[];

  airportCache = rows
    .filter((r) =>
      ["large_airport", "medium_airport", "small_airport"].includes(r.type)
    )
    .filter((r) => r.ident && r.name && r.latitude_deg && r.longitude_deg)
    .map((r) => {
      const city = r.municipality || r.name;
      const iata = r.iata_code || null;
      const country = r.iso_country || "UN";
      const region = continentToRegion(r.continent, country);
      const code = iata ? `${r.ident} / ${iata}` : r.ident;
      return {
        ident: r.ident,
        iata,
        name: r.name,
        type: r.type,
        city,
        country,
        region,
        lat: Number(r.latitude_deg),
        lon: Number(r.longitude_deg),
        label: `${city} - ${r.name} (${code})`,
      };
    });

  return airportCache;
}

export async function searchAirports(
  query: string,
  limit = 12
): Promise<AirportSearchResult[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];
  const airports = await loadAirports();

  return airports
    .map((airport) => {
      const codeMatch =
        airport.ident.toLowerCase() === q ||
        airport.iata?.toLowerCase() === q;
      const starts =
        airport.ident.toLowerCase().startsWith(q) ||
        airport.iata?.toLowerCase().startsWith(q) ||
        airport.city.toLowerCase().startsWith(q);
      const contains =
        airport.label.toLowerCase().includes(q) ||
        airport.country.toLowerCase().includes(q);
      const typeBoost =
        airport.type === "large_airport"
          ? 3
          : airport.type === "medium_airport"
            ? 2
            : 1;
      const score = codeMatch ? 100 : starts ? 50 : contains ? 15 : 0;
      return { airport, score: score + typeBoost };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.airport.label.localeCompare(b.airport.label))
    .slice(0, limit)
    .map((x) => x.airport);
}
