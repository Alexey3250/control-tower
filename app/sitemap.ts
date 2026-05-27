import type { MetadataRoute } from "next";
import { BUILDER } from "@/config/builder";
import { STATIONS } from "@/config/network";

/**
 * Sitemap — main app surface plus one entry per modelled station so the
 * deep drilldowns (e.g. `/stations/OMDB` for Dubai) are also indexable.
 * `/api/*` routes are intentionally excluded; they're declared off-limits
 * in `robots.ts`.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = BUILDER.links.liveUrl.replace(/\/$/, "");
  const now = new Date();

  const top: MetadataRoute.Sitemap = [
    "/",
    "/map",
    "/fleet",
    "/stations",
    "/launches",
    "/feasibility",
    "/vendors",
    "/about",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: now,
    changeFrequency: path === "/" ? "daily" : "weekly",
    priority: path === "/" ? 1.0 : 0.7,
  }));

  const stations: MetadataRoute.Sitemap = STATIONS.map((s) => ({
    url: `${base}/stations/${s.icao}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.4,
  }));

  return [...top, ...stations];
}
