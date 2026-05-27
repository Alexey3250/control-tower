/**
 * Re-capture a single screenshot without rebuilding the rest. Used after
 * tightly-scoped UI tweaks (e.g. action-card severity mix) so the README
 * gets a fresh PNG without paying the cost of the full 8-route walk.
 *
 * Usage:
 *   node scripts/capture-one.mjs / 01-network-overview.png 2500
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { spawn } from "node:child_process";
import net from "node:net";

const [route = "/", file = "tmp.png", waitMs = "2500"] = process.argv.slice(2);
const OUT = "docs/screenshots";

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

async function waitForServer(url, timeoutMs = 120_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      // Short per-request timeout — first compile can hang one fetch but
      // subsequent ones unblock quickly.
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 4000);
      const res = await fetch(url, { method: "GET", signal: ctrl.signal });
      clearTimeout(t);
      if (res.status < 500) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 800));
  }
  throw new Error(`Server at ${url} did not respond within ${timeoutMs}ms`);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const port = await freePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  console.log(`spawn dev → ${baseUrl}`);
  const proc = spawn(
    process.platform === "win32" ? "npm.cmd" : "npm",
    ["run", "dev", "--", "-p", String(port)],
    { stdio: ["ignore", "pipe", "pipe"], shell: process.platform === "win32" }
  );
  proc.stdout.on("data", (d) => {
    const l = d.toString();
    if (/ready|Local:/i.test(l)) process.stdout.write(`  ${l.trim()}\n`);
  });
  proc.stderr.on("data", () => {});
  await waitForServer(baseUrl);
  await new Promise((r) => setTimeout(r, 1500));

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    colorScheme: "light",
    locale: "en-US",
    timezoneId: "Asia/Dubai",
  });
  const page = await ctx.newPage();
  const url = `${baseUrl}${route}`;
  console.log(`load ${url}`);
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 60_000 });
  } catch {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60_000 });
  }
  await page.waitForTimeout(Number(waitMs));
  const buf = await page.screenshot({ fullPage: true, type: "png" });
  await writeFile(join(OUT, file), buf);
  console.log(`✓ wrote ${OUT}/${file}`);

  await browser.close();
  proc.kill();
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
