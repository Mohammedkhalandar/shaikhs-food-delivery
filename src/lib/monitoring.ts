import { createHash, randomUUID } from "node:crypto";
type Area = "payment" | "route" | "root";
const logWindows: Partial<Record<Area, { window: number; hits: number }>> = {};
export function logFailure(area: Area, fingerprint?: string) {
  const window = Math.floor(Date.now() / 60000);
  const budget = logWindows[area]?.window === window ? logWindows[area]! : (logWindows[area] = { window, hits: 0 });
  if (++budget.hits > 60) return undefined; // Avoid log flooding; do not return an unrecorded support ID.
  const reportId = randomUUID();
  console.error(JSON.stringify({ event: "application.failure", area, reportId, timestamp: new Date().toISOString(), ...(fingerprint && /^[a-f0-9]{64}$/.test(fingerprint) ? { fingerprint: createHash("sha256").update(fingerprint).digest("hex") } : {}) }));
  return reportId;
}
let fallbackWindow = 0;
let fallbackHits = 0;
export function allowFallbackReport(now = Date.now()) {
  const window = Math.floor(now / 60000);
  if (window !== fallbackWindow) { fallbackWindow = window; fallbackHits = 0; }
  return ++fallbackHits <= 30;
}
