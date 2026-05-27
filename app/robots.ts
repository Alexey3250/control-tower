import type { MetadataRoute } from "next";
import { BUILDER } from "@/config/builder";

/**
 * Robots policy — allow indexing so when a hiring manager Googles
 * "Alex Efimik Jetex" the demo surfaces. API routes excluded because they
 * return JSON and shouldn't appear as search hits.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/"] }],
    sitemap: `${BUILDER.links.liveUrl}/sitemap.xml`,
    host: BUILDER.links.liveUrl,
  };
}
