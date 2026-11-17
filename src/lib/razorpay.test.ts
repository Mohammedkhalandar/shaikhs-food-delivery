import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { toPaise, validSignature, testPaymentConfig, createProviderOrder } from "./razorpay";
import { safeImageUrl } from "./image-policy";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });
describe("payment security primitives", () => {
  it("keeps decimal amounts exact in integer paise", () => {
    expect(toPaise(new Prisma.Decimal("245.11"))).toBe(24511);
    for (const invalid of ["0", "-1", "0.001", "100000000"]) expect(() => toPaise(new Prisma.Decimal(invalid))).toThrow();
  });
  it("verifies raw bytes and rejects malformed, truncated and altered signatures", () => {
    const raw = Buffer.from('{"test": "☕"}');
    const signature = createHmac("sha256", "fixture-secret").update(raw).digest("hex");
    expect(validSignature(raw, signature, "fixture-secret")).toBe(true);
    for (const bad of [null, "", "a", "g".repeat(64), signature.slice(1), "0".repeat(64)]) expect(validSignature(raw, bad, "fixture-secret")).toBe(false);
    expect(validSignature(Buffer.from('{"test":"☕"}'), signature, "fixture-secret")).toBe(false);
  });
  it("refuses live, missing and disabled keys before making network requests", async () => {
    const fetch = vi.fn(); vi.stubGlobal("fetch", fetch);
    vi.stubEnv("RAZORPAY_TEST_ENABLED", "true"); vi.stubEnv("RAZORPAY_KEY_ID", "rzp_live_forbidden");
    vi.stubEnv("RAZORPAY_KEY_SECRET", "fixture"); vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "x".repeat(32));
    await expect(createProviderOrder("receipt", 100)).rejects.toThrow("not configured");
    vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_fixture"); expect(testPaymentConfig().keyId).toBe("rzp_test_fixture");
    vi.stubEnv("RAZORPAY_TEST_ENABLED", "false"); expect(() => testPaymentConfig()).toThrow();
    expect(fetch).not.toHaveBeenCalled();
  });
  it("allows only local menu paths or explicitly configured HTTPS image hosts", () => {
    vi.stubEnv("MENU_IMAGE_HOSTS", "images.example.test");
    expect(safeImageUrl("/images/biryani.jpg")).toBe("/images/biryani.jpg");
    expect(safeImageUrl("https://images.example.test/dish.jpg")).not.toBeNull();
    for (const bad of ["/images/../.env", "https://evil.example/test.jpg", "http://images.example.test/dish.jpg", "https://user:secret@images.example.test/dish.jpg", "http://127.0.0.1/private", "data:image/svg+xml,test"]) expect(safeImageUrl(bad)).toBeNull();
  });
});
