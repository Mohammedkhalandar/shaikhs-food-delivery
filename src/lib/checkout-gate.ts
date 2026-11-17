import { testPaymentConfig } from "@/lib/razorpay";

/** Operator attestation is server-only; it must follow the documented sandbox checklist. */
export function onlineCheckoutEnabled() {
  if (process.env.RAZORPAY_SANDBOX_VERIFIED !== "true") return false;
  try { testPaymentConfig(); return true; } catch { return false; }
}
