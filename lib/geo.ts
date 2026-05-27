import { STATIONS } from "@/config/network";
import type { Station } from "@/lib/types";

const EARTH_NM = 3440.065;

export function haversineNm(
  a: { lat: number; lon: number },
  b: { lat: number; lon: number }
) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_NM * Math.asin(Math.sqrt(h));
}

export interface NearestStationHit {
  station: Station;
  distanceNm: number;
}

export function nearestStation(
  lat: number,
  lon: number,
  maxNm = 600
): NearestStationHit | null {
  let best: NearestStationHit | null = null;
  for (const s of STATIONS) {
    const d = haversineNm({ lat, lon }, { lat: s.lat, lon: s.lon });
    if (d <= maxNm && (best === null || d < best.distanceNm)) {
      best = { station: s, distanceNm: d };
    }
  }
  return best;
}

export function nmToKm(nm: number) {
  return nm * 1.852;
}

export function msToKt(ms: number) {
  return ms * 1.94384;
}

export function mToFt(m: number) {
  return m * 3.28084;
}
