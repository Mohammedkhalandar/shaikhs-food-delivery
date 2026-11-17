import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

afterEach(() => vi.unstubAllEnvs());
describe("API origin protection", () => {
  it("exempts only the exact signed webhook POST", () => {
    vi.stubEnv("NODE_ENV", "production");
    for (const path of ["/api/webhooks/razorpay/other", "/api/payments/orders"]) expect(middleware(new NextRequest(`http://localhost${path}`, { method: "POST" })).status).toBe(403);
    expect(middleware(new NextRequest("http://localhost/api/webhooks/razorpay", { method: "POST" })).status).toBe(200);
    expect(middleware(new NextRequest("http://localhost/api/webhooks/razorpay", { method: "PATCH" })).status).toBe(403);
  });
  it("rejects forged origins on every mutating method", () => {
    vi.stubEnv("APP_URL", "https://shaikhs.example");
    for (const method of ["POST", "PUT", "PATCH", "DELETE"]) {
      const req = new NextRequest("https://shaikhs.example/api/orders", { method, headers: { Origin: "https://attacker.example" } });
      expect(middleware(req).status).toBe(403);
    }
  });
  it("requires production Origin and accepts the configured same origin", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("APP_URL", "https://shaikhs.example");
    expect(middleware(new NextRequest("https://internal/api/orders", { method: "POST" })).status).toBe(403);
    expect(middleware(new NextRequest("https://internal/api/orders", { method: "POST", headers: { Origin: "https://shaikhs.example" } })).status).toBe(200);
  });
  it("keeps public reads available", () => {
    expect(middleware(new NextRequest("http://localhost/api/catalog")).status).toBe(200);
  });
  it("prevents caching API reads, writes, rejections and signed webhooks", () => {
    vi.stubEnv("NODE_ENV", "production");
    for (const [path, method] of [["/api/auth/me", "GET"], ["/api/orders", "GET"], ["/api/orders", "POST"], ["/api/webhooks/razorpay", "POST"]]) {
      expect(middleware(new NextRequest(`http://localhost${path}`, { method })).headers.get("cache-control")).toBe("no-store");
    }
  });
});
