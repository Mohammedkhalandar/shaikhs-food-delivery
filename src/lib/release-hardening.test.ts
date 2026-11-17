import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readdirSync } from "node:fs";
import { requiredMigrations, migrationsReady } from "./schema-readiness";
import { allowFallbackReport, logFailure } from "./monitoring";
const mocks = vi.hoisted(() => ({ query: vi.fn(), limit: vi.fn() }));
vi.mock("@/lib/prisma", () => ({ prisma: { $queryRaw: mocks.query } }));
vi.mock("@/lib/rate-limit", () => ({ rateLimit: mocks.limit }));
import { GET as ready } from "@/app/api/health/ready/route";
import { POST as report } from "@/app/api/monitoring/client-error/route";
import { paymentFailure } from "./payment-api";

const applied = requiredMigrations.map(migration_name => ({ migration_name, finished_at: new Date(), rolled_back_at: null as Date | null }));
const request = (data: unknown) => new Request("http://localhost/api/monitoring/client-error", { method: "POST", body: JSON.stringify(data) });
beforeEach(() => { vi.clearAllMocks(); mocks.limit.mockResolvedValue(true); });
afterEach(() => vi.restoreAllMocks());
describe("release readiness", () => {
  it("tracks every committed migration", () => {
    const local = readdirSync("prisma/migrations", { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort();
    expect([...requiredMigrations]).toEqual(local);
  });
  it("requires all migrations, ignores rolled-back attempts and rejects failed attempts", () => {
    expect(migrationsReady(applied)).toBe(true);
    expect(migrationsReady(applied.slice(1))).toBe(false);
    expect(migrationsReady([...applied, { migration_name: "failed", finished_at: null, rolled_back_at: null }])).toBe(false);
    expect(migrationsReady([...applied, { migration_name: "rolled-back", finished_at: null, rolled_back_at: new Date() }])).toBe(true);
  });
  it("returns private readiness without leaking missing schema/connection details", async () => {
    mocks.query.mockResolvedValue(applied);
    const ok = await ready(); expect(ok.status).toBe(200); expect(ok.headers.get("cache-control")).toBe("no-store");
    mocks.query.mockResolvedValue(applied.slice(1)); expect((await ready()).status).toBe(503);
    mocks.query.mockRejectedValue(new Error("postgres://private-user:secret@database"));
    const failed = await ready(); expect(failed.status).toBe(503); expect(await failed.json()).toEqual({ status: "unavailable" });
  });
});
describe("privacy-preserving monitoring", () => {
  it("logs an allowlisted event/reference only, never raw error content", () => {
    const output = vi.spyOn(console, "error").mockImplementation(() => {});
    const id = logFailure("payment", "password=must-not-log");
    const event = JSON.parse(output.mock.calls[0][0] as string);
    expect(event.reportId).toBe(id); expect(event.area).toBe("payment"); expect(event.fingerprint).toBeUndefined();
    expect(JSON.stringify(event)).not.toContain("password");
    logFailure("route", "a".repeat(64));
    expect(JSON.parse(output.mock.calls[1][0] as string).fingerprint).not.toBe("a".repeat(64));
    const response = paymentFailure(new Error("private-token-or-card"));
    expect(response.status).toBe(503); expect(JSON.stringify(output.mock.calls)).not.toContain("private-token-or-card");
  });
  it("accepts bounded metadata, emits a report ID, rejects arbitrary messages", async () => {
    const output = vi.spyOn(console, "error").mockImplementation(() => {});
    const response = await report(request({ area: "route", fingerprint: "a".repeat(64) }));
    expect(response.status).toBe(202); expect((await response.json()).reportId).toMatch(/^[a-f0-9-]{36}$/);
    expect(output).toHaveBeenCalledOnce();
    expect((await report(request({ area: "route", message: "secret" }))).status).toBe(400);
    expect((await report(request({ area: "route", fingerprint: "private-error" }))).status).toBe(400);
    expect((await report(new Request("http://localhost/api", { method: "POST", body: "x".repeat(16385) }))).status).toBe(413);
    expect(output).toHaveBeenCalledOnce();
  });
  it("limits reports, including a bounded DB-outage fallback", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.limit.mockResolvedValue(false); expect((await report(request({ area: "root" }))).status).toBe(429);
    mocks.limit.mockRejectedValue(new Error("Database down"));
    expect((await report(request({ area: "root" }))).status).toBe(202);
    const window = Date.now() + 600000;
    const results = Array.from({ length: 35 }, () => allowFallbackReport(window));
    expect(results.filter(Boolean)).toHaveLength(30);
  });
  it("bounds repeated server failure logs without inventing support references", () => {
    vi.spyOn(Date, "now").mockReturnValue(Date.now() + 120000);
    const output = vi.spyOn(console, "error").mockImplementation(() => {});
    const ids = Array.from({ length: 65 }, () => logFailure("payment"));
    expect(output).toHaveBeenCalledTimes(60); expect(ids.filter(Boolean)).toHaveLength(60);
    expect(ids[64]).toBeUndefined();
  });
});
