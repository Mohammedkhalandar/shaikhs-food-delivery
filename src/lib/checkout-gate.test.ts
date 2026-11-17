import { afterEach, expect, it, vi } from "vitest";
import { onlineCheckoutEnabled } from "./checkout-gate";
import { GET } from "@/app/api/payments/config/route";
afterEach(() => vi.unstubAllEnvs());
it("requires both test credentials and explicit sandbox acceptance, never exposes secrets", async () => {
  vi.stubEnv("RAZORPAY_SANDBOX_VERIFIED", "false");
  vi.stubEnv("RAZORPAY_TEST_ENABLED", "true"); vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_fixture");
  vi.stubEnv("RAZORPAY_KEY_SECRET", "private-fixture-key"); vi.stubEnv("RAZORPAY_WEBHOOK_SECRET", "private-fixture-webhook".repeat(2));
  expect(onlineCheckoutEnabled()).toBe(false);
  vi.stubEnv("RAZORPAY_SANDBOX_VERIFIED", "true"); expect(onlineCheckoutEnabled()).toBe(true);
  const response = await GET(); expect(await response.json()).toEqual({ enabled: true, mode: "test" });
  expect(response.headers.get("cache-control")).toBe("no-store");
  vi.stubEnv("RAZORPAY_KEY_ID", "rzp_live_forbidden"); expect(onlineCheckoutEnabled()).toBe(false);
  vi.stubEnv("RAZORPAY_KEY_ID", "rzp_test_fixture"); vi.stubEnv("RAZORPAY_KEY_SECRET", ""); expect(onlineCheckoutEnabled()).toBe(false);
});
