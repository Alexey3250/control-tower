#!/usr/bin/env node
/**
 * Capture portfolio-grade screenshots of every module into `docs/screenshots/`.
 *
 * Workflow:
 *   1. Spawns `next dev` on a free port (or reuses BASE_URL if set).
 *   2. Uses Playwright Chromium at 1440×900 to load each route.
 *   3. Waits for the dashboard chrome to settle, then snaps a full-page PNG.
 *   4. Writes one PNG per route to `docs/screenshots/`.
 *
 * Usage:
 *   npm run screenshots                          (auto-spawns dev server)
 *   BASE_URL=http://localhost:3001 npm run screenshots   (reuses a running one)
 *
 * Requires Playwright (installed as devDependency). On first run, it will
 * download Chromium (~150MB) into `node_modules/.cache/ms-playwright/`.
 */

import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
import net from "node:net";

const OUT = "docs/screenshots";
const VIEWPORT = { width: 1440, height: 900 };

/** Routes that should be captured. */
const ROUTES = [
  { path: "/", file: "01-network-overview.png", wait: 2500 },
  { path: "/map", file: "02-operations-map.png", wait: 4500 },
  { path: "/fleet", file: "03-fleet-intelligence.png", wait: 3000 },
  { path: "/stations", file: "04-station-risk.png", wait: 2500 },
  { path: "/launches", file: "05-launch-tracker.png", wait: 2500 },
  { path: "/feasibility", file: "06-feasibility-studio.png", wait: 2500 },
  { path: "/vendors", file: "07-vendor-scorecard.png", wait: 2500 },
  { path: "/about", file: "08-about.png", wait: 2500 },
];

/** Find a free TCP port for the spawned dev server. */
function freePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.unref();
    srv.on("error", reject);
    srv.listen(0, () => {
      const { port } = srv.address();
      srv.close(() => resolve(port));
    });
  });
}

/** Wait for an HTTP endpoint to respond 2xx/3xx. */
async function waitForServer(url, timeoutMs = 90_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { method: "GET" });
      if (res.status < 500) return;
    } catch {
      /* keep polling */
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  throw new Error(`Server at ${url} did not respond within ${timeoutMs}ms`);
}

async function main() {
  await mkdir(OUT, { recursive: true });

  // ---- Boot dev server (unless BASE_URL provided) ----
  let baseUrl = process.env.BASE_URL;
  let serverProc = null;

  if (!baseUrl) {
    const port = await freePort();
    baseUrl = `http://localhost:${port}`;
    console.log(`> spawning next dev on ${baseUrl}`);
    serverProc = spawn(
      process.platform === "win32" ? "npm.cmd" : "npm",
      ["run", "dev", "--", "-p", String(port)],
      { stdio: ["ignore", "pipe", "pipe"], shell: process.platform === "win32" }
    );
    // Surface fatal errors only.
    serverProc.stdout.on("data", (d) => {
      const line = d.toString();
      if (/ready|Local:/i.test(line)) {
        process.stdout.write(`  dev: ${line.trim()}\n`);
      }
    });
    serverProc.stderr.on("data", (d) => {
      const line = d.toString().trim();
      if (line) process.stderr.write(`  dev-err: ${line}\n`);
    });

    await waitForServer(baseUrl);
    // Give Turbopack a beat to finish the first compile.
    await new Promise((r) => setTimeout(r, 1500));
  } else {
    console.log(`> reusing existing server at ${baseUrl}`);
  }

  // ---- Capture ----
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2, // crisp on Retina/HiDPI
    colorScheme: "light",
    locale: "en-US",
    timezoneId: "Asia/Dubai",
  });
  const page = await context.newPage();

  for (const route of ROUTES) {
    const url = `${baseUrl}${route.path}`;
    console.log(`> capturing ${url} → ${route.file}`);
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
    } catch {
      // Networkidle can flake on long-polling pages; fall back.
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
    }
    // Give MapLibre / Recharts time to render.
    await page.waitForTimeout(route.wait);
    const buf = await page.screenshot({ fullPage: true, type: "png" });
    await writeFile(join(OUT, route.file), buf);
  }

  await browser.close();
  if (serverProc) {
    serverProc.kill();
  }
  console.log(`\n✓ Screenshots written to ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
