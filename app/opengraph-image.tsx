import { ImageResponse } from "next/og";
import { BUILDER } from "@/config/builder";
import { STATIONS } from "@/config/network";

/**
 * Dynamic OpenGraph card — 1200×630 image generated at build/edge time.
 * Shows up as the link preview when anyone shares the deployed URL on
 * LinkedIn, WhatsApp, Slack, Teams, X, etc.
 *
 * Kept intentionally restrained: white background, big Jetex-orange brand
 * lockup on the left, builder name on the right. The HR person who pastes
 * the URL into a recruiter chat gets a card that says exactly who built
 * this and what it's about — without them having to open the link.
 */

export const runtime = "edge";
export const alt =
  "Jetex Network Operations Control Tower — portfolio project by Alex Efimik";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  const stations = STATIONS.length;
  const regions = new Set(STATIONS.map((s) => s.region)).size;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#ffffff",
          padding: "56px 64px",
          fontFamily: "Inter, system-ui, sans-serif",
          color: "#0f1115",
          position: "relative",
        }}
      >
        {/* Orange accent bar at top */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background:
              "linear-gradient(90deg, #f37021 0%, #d45a14 50%, #f37021 100%)",
          }}
        />

        {/* Header — Jetex lockup */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 64,
              height: 64,
              background: "#f37021",
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 14px rgba(243,112,33,0.45)",
            }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
            </svg>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                letterSpacing: 2,
                color: "#0f1115",
                lineHeight: 1,
              }}
            >
              JETEX
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#f37021",
                textTransform: "uppercase",
                letterSpacing: 3,
                marginTop: 4,
              }}
            >
              Control Tower
            </div>
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 56,
            maxWidth: 980,
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "#f37021",
            }}
          >
            FBO Network Operations
          </div>
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              lineHeight: 1.05,
              marginTop: 16,
              color: "#0f1115",
              letterSpacing: -1.5,
            }}
          >
            Which station needs attention today —
            <br />
            and what should we do about it?
          </div>
        </div>

        {/* Stats strip */}
        <div
          style={{
            display: "flex",
            gap: 48,
            marginTop: 44,
            color: "#3a4150",
          }}
        >
          <Stat n={stations} l="DESTINATIONS" />
          <Stat n={regions} l="REGIONS" />
          <Stat n={6} l="MODULES" />
          <Stat n={4} l="REAL DATA FEEDS" />
        </div>

        {/* Spacer */}
        <div style={{ flex: 1, display: "flex" }} />

        {/* Footer — builder identity */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid #e6e8ec",
            paddingTop: 24,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 3,
                textTransform: "uppercase",
                color: "#f37021",
              }}
            >
              Portfolio project · built by
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: "#0f1115",
                marginTop: 4,
                letterSpacing: -0.5,
              }}
            >
              {BUILDER.name}
            </div>
            <div
              style={{
                fontSize: 16,
                color: "#6b7280",
                marginTop: 2,
              }}
            >
              {BUILDER.tagline} · for the Operations Analyst role
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-end",
              fontSize: 14,
              color: "#3a4150",
              gap: 4,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#0a66c2", fontWeight: 700 }}>in</span>
              {BUILDER.links.linkedinHandle}
            </div>
            <div style={{ color: "#6b7280" }}>{BUILDER.links.phoneDisplay}</div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

function Stat({ n, l }: { n: number; l: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div
        style={{
          fontSize: 56,
          fontWeight: 800,
          color: "#0f1115",
          lineHeight: 1,
          letterSpacing: -1,
        }}
      >
        {n}
      </div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 2,
          color: "#9aa3b2",
          marginTop: 6,
        }}
      >
        {l}
      </div>
    </div>
  );
}
