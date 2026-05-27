import "server-only";

export interface AviationWeather {
  icao: string;
  metar: string | null;
  taf: string | null;
  observedAt: string | null;
  windKt: number | null;
  gustKt: number | null;
  visibilityM: number | null;
  ceilingFt: number | null;
  tempC: number | null;
  condition: string | null;
  source: "NOAA" | "unavailable";
}

const NOAA_BASE = "https://aviationweather.gov/api/data";

function asNumber(v: unknown): number | null {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

function pickString(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return null;
}

function pickNumber(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = asNumber(row[key]);
    if (value !== null) return value;
  }
  return null;
}

async function fetchJsonRows(url: string) {
  const res = await fetch(url, {
    next: { revalidate: 300, tags: ["noaa-aviation-weather"] },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as unknown;
  return Array.isArray(json)
    ? json.filter((row): row is Record<string, unknown> => row !== null)
    : [];
}

export async function getAviationWeather(
  icao: string
): Promise<AviationWeather> {
  const id = icao.toUpperCase();
  const base: AviationWeather = {
    icao: id,
    metar: null,
    taf: null,
    observedAt: null,
    windKt: null,
    gustKt: null,
    visibilityM: null,
    ceilingFt: null,
    tempC: null,
    condition: null,
    source: "unavailable",
  };

  try {
    const metarUrl = `${NOAA_BASE}/metar?ids=${encodeURIComponent(
      id
    )}&format=json`;
    const tafUrl = `${NOAA_BASE}/taf?ids=${encodeURIComponent(
      id
    )}&format=json`;

    const [metarRows, tafRows] = await Promise.all([
      fetchJsonRows(metarUrl),
      fetchJsonRows(tafUrl),
    ]);
    const metar = metarRows[0];
    const taf = tafRows[0];

    if (!metar && !taf) return base;

    return {
      icao: id,
      metar: metar ? pickString(metar, ["rawOb", "raw_text", "raw"]) : null,
      taf: taf ? pickString(taf, ["rawTAF", "rawOb", "raw_text", "raw"]) : null,
      observedAt: metar
        ? pickString(metar, ["obsTime", "reportTime", "receiptTime"])
        : null,
      windKt: metar ? pickNumber(metar, ["wspd", "windSpeed"]) : null,
      gustKt: metar ? pickNumber(metar, ["wgst", "windGust"]) : null,
      visibilityM: metar
        ? pickNumber(metar, ["visib", "visib_m", "visibility"])
        : null,
      ceilingFt: metar ? pickNumber(metar, ["ceil", "ceiling"]) : null,
      tempC: metar ? pickNumber(metar, ["temp", "temp_c"]) : null,
      condition: metar
        ? pickString(metar, ["wxString", "wx", "clouds"])
        : null,
      source: "NOAA",
    };
  } catch (err) {
    console.warn(`[noaa] aviation weather fetch failed ${id}`, err);
    return base;
  }
}
