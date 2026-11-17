"use client";
import { useRef, useState } from "react";
import { checkOnlinePayment, startOnlinePayment, type CheckoutPhase, type CheckoutResult } from "@/lib/checkout-client";

const labels: Record<CheckoutPhase, string> = { preparing: "Preparing your payment…", loading: "Loading secure test checkout…", open: "Complete your test payment in the secure window.", verifying: "Verifying payment with the server…", checking: "Checking verified payment status…" };
export function OnlinePayment({ orderId, total, enabled, onRefresh }: { orderId: string; total: string | number; enabled: boolean; onRefresh: () => Promise<void> }) {
  const [phase, setPhase] = useState<CheckoutPhase | null>(null);
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [error, setError] = useState("");
  const lock = useRef(false);
  async function act(pay: boolean) {
    if (lock.current) return;
    lock.current = true; setError(""); setPhase(pay ? "preparing" : "checking");
    try { setResult(await (pay ? startOnlinePayment(orderId, setPhase) : checkOnlinePayment(orderId))); }
    catch (error) { setError(error instanceof Error ? error.message : "Payment unavailable. Check status before retrying."); }
    finally { await onRefresh().catch(() => setError("Order refresh failed. Check status before retrying payment.")); lock.current = false; setPhase(null); }
  }
  const terminal = result && ["paid", "refunded", "review", "expired"].includes(result.kind);
  return <div className="online-payment" role="group" aria-label="Online payment">
    <p role="status" aria-live="polite">{phase ? labels[phase] : result?.message ?? "Test payment is pending. This order will reach the kitchen only after verified capture."}</p>
    {error && <p role="alert">{error}</p>}
    {!enabled && !terminal && <p>Online payment is currently unavailable. Your order is saved; you can still check its payment status.</p>}
    <div className="payment-actions" aria-busy={Boolean(phase)}>
      {!terminal && <button className="primary" type="button" disabled={!enabled || Boolean(phase)} onClick={() => void act(true)}>{result || error ? "Retry payment" : `Pay ₹${Number(total).toFixed(2)} · Test mode`}</button>}
      <button className="outline" type="button" disabled={Boolean(phase)} onClick={() => void act(false)}>Check payment status</button>
    </div>
  </div>;
}
