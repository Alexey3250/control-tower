import "server-only";

/**
 * Open-Meteo historical climate aggregator. Used by the feasibility simulator
 * to derive a weather-tolerability sub-score from a candidate airport's
 * climate over the last few years.
 */

const ARCHIVE_BASE = "https://archive-api.open-meteo.com/v1/archive";

export interface WeatherProfile {
  /** Mean wind speed kt */
  avgWindKt: number;
  /** Days/year with gust > 35kt */
  highWindDays: number;
  /** Days/year with precipitation > 5mm */
  rainyDays: number;
  /** Days/year with max temp > 40C */
  hotDays: number;
  /** Days/year with min temp < 0C */
  coldDays: number;
  /** Days/year with low visibility (fog/snow proxy) */
  lowVisDays: number;
  /** 0-1 tolerability: 1 = excellent, 0 = inhospitable */
  tolerability: number;
}

const FALLBACK_PROFILE: WeatherProfile = {
  avgWindKt: 9,
  highWindDays: 10,
  rainyDays: 60,
  hotDays: 20,
  coldDays: 20,
  lowVisDays: 8,
  tolerability: 0.78,
};

export async function getWeatherProfile(
  lat: number,
  lon: number
): Promise<WeatherProfile> {
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return FALLBACK_PROFILE;

  const end = new Date();
  end.setDate(end.getDate() - 7);
  const start = new Date(end);
  start.setFullYear(start.getFullYear() - 2);

  const params = new URLSearchParams({
    latitude: lat.toFixed(3),
    longitude: lon.toFixed(3),
    start_date: start.toISOString().slice(0, 10),
    end_date: end.toISOString().slice(0, 10),
    daily: [
      "windspeed_10m_max",
      "windgusts_10m_max",
      "precipitation_sum",
      "temperature_2m_max",
      "temperature_2m_min",
      "snowfall_sum",
    ].join(","),
    timezone: "UTC",
    windspeed_unit: "kn",
  });

  try {
    const res = await fetch(`${ARCHIVE_BASE}?${params.toString()}`, {
      next: { revalidate: 86_400, tags: ["open-meteo"] },
    });
    if (!res.ok) return FALLBACK_PROFILE;
    const json = (await res.json()) as {
      daily?: {
        windspeed_10m_max?: number[];
        windgusts_10m_max?: number[];
        precipitation_sum?: number[];
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
        snowfall_sum?: number[];
      };
    };
    const d = json.daily;
    if (!d) return FALLBACK_PROFILE;

    const days = d.windspeed_10m_max?.length ?? 0;
    if (!days) return FALLBACK_PROFILE;
    const years = days / 365;

    const avg = (arr?: number[]) =>
      arr && arr.length
        ? arr.reduce((a, b) => a + (b ?? 0), 0) / arr.length
        : 0;
    const countAbove = (arr: number[] | undefined, threshold: number) =>
      (arr ?? []).filter((v) => v != null && v > threshold).length;
    const countBelow = (arr: number[] | undefined, threshold: number) =>
      (arr ?? []).filter((v) => v != null && v < threshold).length;

    const avgWindKt = avg(d.windspeed_10m_max);
    const highWindDays = countAbove(d.windgusts_10m_max, 35) / Math.max(years, 0.5);
    const rainyDays = countAbove(d.precipitation_sum, 5) / Math.max(years, 0.5);
    const hotDays = countAbove(d.temperature_2m_max, 40) / Math.max(years, 0.5);
    const coldDays = countBelow(d.temperature_2m_min, 0) / Math.max(years, 0.5);
    const lowVisDays = countAbove(d.snowfall_sum, 1) / Math.max(years, 0.5);

    const tolerability = Math.max(
      0,
      Math.min(
        1,
        1 -
          (highWindDays / 80 +
            rainyDays / 220 +
            hotDays / 90 +
            coldDays / 110 +
            lowVisDays / 40) /
            5
      )
    );

    return {
      avgWindKt: Number(avgWindKt.toFixed(1)),
      highWindDays: Math.round(highWindDays),
      rainyDays: Math.round(rainyDays),
      hotDays: Math.round(hotDays),
      coldDays: Math.round(coldDays),
      lowVisDays: Math.round(lowVisDays),
      tolerability: Number(tolerability.toFixed(3)),
    };
  } catch {
    return FALLBACK_PROFILE;
  }
}
