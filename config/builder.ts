/**
 * Single source-of-truth for the human who built this dashboard.
 *
 * Surfaced (in order of prominence) on:
 *   - /about            — full-width "About the builder" hero card
 *   - <PortfolioFooter> — compact attribution on every dashboard page
 *   - <Sidenav>         — small avatar + name pinned bottom-left
 *   - /                 — single-line attribution chip in the network strip
 */

export const BUILDER = {
  name: "Alex Efimik",
  /** Short positioning line used under the name. */
  tagline: "Operations & Analytics · Dubai",
  /** One-sentence pitch for the About page hero. */
  pitch:
    "Built this control tower in Next.js + TypeScript to demonstrate how I'd approach the Operations Analyst role at Jetex — wiring real public data (OpenSky, NOAA, Open-Meteo, OurAirports) into a BI-grade decision-support UI alongside deterministic synthetic ops data.",
  location: "Dubai, UAE",
  photo: "/builder.png",
  links: {
    linkedinUrl: "https://www.linkedin.com/in/efimik/",
    linkedinHandle: "linkedin.com/in/efimik",
    /** Stored sans spaces / plus sign for `tel:` and `wa.me`. */
    phoneE164: "+971527846185",
    phoneDisplay: "+971 52 784 6185",
    whatsappUrl: "https://wa.me/971527846185",
    /** Optional email — left blank because the user only provided phone. */
    email: "",
    /** Production deployment — referenced in metadata, README, and the CV. */
    liveUrl: "https://control-tower-sand-theta.vercel.app",
    repoUrl: "https://github.com/Alexey3250/control-tower",
  },
} as const;
