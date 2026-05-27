import type { Feature, Polygon } from "geojson";

/**
 * Day/night terminator computation.
 *
 * Given a date, produces a GeoJSON polygon covering the night-side of the
 * globe based on the sun's current sub-solar point. The polygon walks the
 * terminator great-circle once, then closes via the pole that is currently
 * in night (winter pole). Resolution is 2° in longitude which is plenty for
 * a smooth-looking overlay at the zoom levels we care about.
 *
 * Algorithm references:
 *   - NOAA Solar Calculator equations (simplified, accurate to ~0.5°)
 *   - Standard terminator latitude formula: lat = atan(-cos(h) / tan(δ))
 *     where h = local hour angle (lon - subsolar_lon) and δ = solar
 *     declination (subsolar latitude).
 */

function julianDay(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

function rad(d: number) {
  return (d * Math.PI) / 180;
}
function deg(r: number) {
  return (r * 180) / Math.PI;
}

/** Solar declination in degrees. */
function sunDeclination(jd: number): number {
  const n = jd - 2451545.0;
  const Lmean = (280.46 + 0.9856474 * n) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360);
  const lambda =
    Lmean + 1.915 * Math.sin(rad(g)) + 0.02 * Math.sin(rad(2 * g));
  const epsilon = 23.439 - 0.0000004 * n;
  return deg(Math.asin(Math.sin(rad(epsilon)) * Math.sin(rad(lambda))));
}

/** Greenwich Mean Sidereal Time in degrees (0..360). */
function gmst(jd: number): number {
  const d = jd - 2451545.0;
  const t = d / 36525;
  const v =
    280.46061837 + 360.98564736629 * d + 0.000387933 * t * t - (t * t * t) / 38710000;
  return ((v % 360) + 360) % 360;
}

/** Right ascension of the sun in degrees. */
function sunRightAscension(jd: number): number {
  const n = jd - 2451545.0;
  const Lmean = (280.46 + 0.9856474 * n) % 360;
  const g = (357.528 + 0.9856003 * n) % 360;
  const lambda =
    Lmean + 1.915 * Math.sin(rad(g)) + 0.02 * Math.sin(rad(2 * g));
  const epsilon = 23.439 - 0.0000004 * n;
  let ra = deg(
    Math.atan2(
      Math.cos(rad(epsilon)) * Math.sin(rad(lambda)),
      Math.cos(rad(lambda))
    )
  );
  ra = ((ra % 360) + 360) % 360;
  return ra;
}

/** Longitude on Earth's surface where the sun is directly overhead, in [-180, 180]. */
export function subsolarLongitude(date: Date = new Date()): number {
  const jd = julianDay(date);
  const ra = sunRightAscension(jd);
  const g = gmst(jd);
  let lon = ra - g;
  lon = ((lon + 540) % 360) - 180;
  return lon;
}

/** Latitude on Earth's surface where the sun is directly overhead, in [-23.45, 23.45]. */
export function subsolarLatitude(date: Date = new Date()): number {
  return sunDeclination(julianDay(date));
}

/**
 * GeoJSON polygon covering the night-side of the globe at the given instant.
 * Returns a single Polygon feature in WGS84 coordinates.
 */
export function nightPolygon(date: Date = new Date()): Feature<Polygon> {
  const subLon = subsolarLongitude(date);
  const subLat = subsolarLatitude(date);
  const tanSubLat = Math.tan(rad(subLat));

  const ring: [number, number][] = [];
  const step = 2;

  for (let lon = -180; lon <= 180; lon += step) {
    let h = lon - subLon;
    // Normalize hour angle to [-180, 180]
    h = ((h + 540) % 360) - 180;
    let lat: number;
    if (Math.abs(tanSubLat) < 1e-9) {
      // Equinox — terminator approximates the lon = subLon ± 90 meridian.
      // Use a vertical jump near those longitudes; otherwise extreme latitudes.
      lat = Math.abs(h) < 90 ? 0 : 0;
    } else {
      lat = deg(Math.atan(-Math.cos(rad(h)) / tanSubLat));
    }
    ring.push([lon, lat]);
  }

  // Close the polygon via the pole that's currently in night.
  // When subsolar lat > 0 (northern summer), the south pole is in night.
  const nightPoleLat = subLat > 0 ? -90 : 90;
  ring.push([180, nightPoleLat]);
  ring.push([-180, nightPoleLat]);
  ring.push([ring[0][0], ring[0][1]]);

  return {
    type: "Feature",
    properties: {
      subsolarLon: subLon,
      subsolarLat: subLat,
      computedAt: date.toISOString(),
    },
    geometry: {
      type: "Polygon",
      coordinates: [ring],
    },
  };
}
