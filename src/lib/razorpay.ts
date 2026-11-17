import { createHmac, timingSafeEqual } from "node:crypto";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { HttpError } from "@/lib/http-body";

export class PaymentError extends HttpError {}

export function testPaymentConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (process.env.RAZORPAY_TEST_ENABLED !== "true" || !keyId || !/^rzp_test_[A-Za-z0-9]+$/.test(keyId) || !keySecret || !webhookSecret || webhookSecret.length < 32) {
    throw new PaymentError(503, "Test payments are not configured");
  }
  return { keyId, keySecret, webhookSecret };
}

export function toPaise(amount: Prisma.Decimal) {
  const paise = amount.times(100);
  if (!paise.isInteger() || paise.lessThanOrEqualTo(0) || paise.greaterThan(9999999999)) throw new PaymentError(409, "Invalid payment amount");
  return paise.toNumber();
}

export function validSignature(body: string | Buffer, signature: string | null, secret: string) {
  if (!signature || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  return timingSafeEqual(createHmac("sha256", secret).update(body).digest(), Buffer.from(signature, "hex"));
}

const amount = z.number().int().positive().max(9999999999);
export const providerOrderSchema = z.object({ id: z.string().regex(/^order_[A-Za-z0-9]+$/), amount, currency: z.literal("INR"), receipt: z.string(), status: z.enum(["created", "attempted", "paid"]) });
export const providerPaymentSchema = z.object({ id: z.string().regex(/^pay_[A-Za-z0-9]+$/), order_id: z.string(), amount, currency: z.literal("INR"), status: z.enum(["created", "authorized", "captured", "refunded", "failed"]), amount_refunded: z.number().int().nonnegative().optional() });
export const providerRefundSchema = z.object({ id: z.string().regex(/^rfnd_[A-Za-z0-9]+$/), payment_id: z.string(), amount, currency: z.literal("INR"), status: z.enum(["pending", "processed", "failed"]) });
export type ProviderPayment = z.infer<typeof providerPaymentSchema>;
export type ProviderRefund = z.infer<typeof providerRefundSchema>;

// Deliberately fixed HTTPS origin. No configurable proxy/base URL, redirects or live keys.
async function provider(path: string, method = "GET", body?: unknown, headers?: Record<string, string>) {
  const config = testPaymentConfig();
  try {
    const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
      method, redirect: "error", cache: "no-store", signal: AbortSignal.timeout(10000),
      headers: { Authorization: `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64")}`, "Content-Type": "application/json", ...headers },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!response.ok) throw new Error("Provider rejected request");
    return await response.json();
  } catch { throw new PaymentError(503, "Payment provider unavailable; reconcile before retrying"); }
}

export async function createProviderOrder(receipt: string, amountPaise: number) {
  return providerOrderSchema.parse(await provider("orders", "POST", { amount: amountPaise, currency: "INR", receipt }));
}
export async function recoverProviderOrder(receipt: string) {
  const result = z.object({ items: z.array(providerOrderSchema) }).parse(await provider(`orders?receipt=${encodeURIComponent(receipt)}&count=100`));
  const matches = result.items.filter(order => order.receipt === receipt);
  if (matches.length !== 1) throw new PaymentError(409, "Provider order creation is unresolved; reconcile receipt before retrying. No second order was created.");
  return matches[0];
}
export async function fetchProviderPayment(id: string) {
  return providerPaymentSchema.parse(await provider(`payments/${encodeURIComponent(id)}`));
}
export async function fetchOrderPayments(id: string) {
  return z.object({ items: z.array(providerPaymentSchema) }).parse(await provider(`orders/${encodeURIComponent(id)}/payments`)).items;
}
export async function fetchRefunds(id: string) {
  return z.object({ items: z.array(providerRefundSchema) }).parse(await provider(`payments/${encodeURIComponent(id)}/refunds?count=100`)).items;
}
export async function createProviderRefund(paymentId: string, amountPaise: number, key: string) {
  return providerRefundSchema.parse(await provider(`payments/${encodeURIComponent(paymentId)}/refund`, "POST", { amount: amountPaise, speed: "normal", receipt: key }, { "X-Refund-Idempotency": key }));
}
