// Browser-only orchestration. Secrets and signature verification stay on the server.
export type CheckoutPhase = "preparing" | "loading" | "open" | "verifying" | "checking";
export type CheckoutResult = { kind: "paid" | "refunded" | "pending" | "cancelled" | "failed" | "uncertain" | "review" | "expired"; message: string };
type Callback = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type Payment = { id: string; orderId: string; amount: number; currency: string; providerOrderId: string | null; state: string; needsReview: boolean; keyId?: string; awaitingCapture?: boolean };
type Snapshot = { order: { id: string; status: string; paymentStatus: string }; payment: Payment | null };
type Options = {
  key: string; amount: number; currency: "INR"; order_id: string; name: string; description: string;
  handler: (response: Callback) => void; modal: { ondismiss: () => void; animation: boolean }; retry: { enabled: false }; theme: { color: string };
};
type CheckoutInstance = { open: () => void; close: () => void; on: (event: "payment.failed", handler: () => void) => void };
type CheckoutConstructor = new (options: Options) => CheckoutInstance;
declare global { interface Window { Razorpay?: CheckoutConstructor } }
let sdkLoading: Promise<CheckoutConstructor> | null = null;
let active = false;

export function loadCheckoutSdk(): Promise<CheckoutConstructor> {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  if (sdkLoading) return sdkLoading;
  sdkLoading = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    const timer = window.setTimeout(() => fail(), 15000);
    const fail = () => { window.clearTimeout(timer); script.onload = null; script.onerror = null; script.remove(); sdkLoading = null; reject(new Error("Secure payment window could not load. Check your connection and retry this order.")); };
    script.onerror = fail;
    script.onload = () => { if (!window.Razorpay) return fail(); window.clearTimeout(timer); resolve(window.Razorpay); };
    document.head.appendChild(script);
  });
  return sdkLoading;
}

async function api<T>(url: string, body?: unknown): Promise<T> {
  const response = await fetch(url, { method: body === undefined ? "GET" : "POST", credentials: "same-origin", cache: "no-store", signal: AbortSignal.timeout(15000), ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }) });
  const result = await response.json();
  if (!response.ok) throw new Error(typeof result.error === "string" ? result.error : "Payment could not be confirmed. Check status before retrying.");
  return result as T;
}
function known(payment: Payment | null, order?: Snapshot["order"]): CheckoutResult | null {
  if (payment?.needsReview) return { kind: "review", message: "Payment requires a review. Do not pay again; contact the kitchen with your order number." };
  if (payment?.state === "REFUNDED" || order?.paymentStatus === "REFUNDED") return { kind: "refunded", message: "Refund confirmed by the server." };
  if (payment?.state === "CAPTURED" || order?.paymentStatus === "PAID") return { kind: "paid", message: order?.status === "CANCELLED" ? "Payment received for a cancelled order. Refund reconciliation is required; do not pay again." : "Payment confirmed by the server. Your order is ready for the kitchen." };
  if (payment?.state === "EXPIRED" || order?.status === "CANCELLED") return { kind: "expired", message: "This order is no longer payable. No new payment window was opened." };
  if (payment?.awaitingCapture) return { kind: "pending", message: "A payment authorization is pending. Do not pay again; check status until the bank confirms its outcome." };
  return null;
}

export async function checkOnlinePayment(orderId: string): Promise<CheckoutResult> {
  const snapshot = await api<Snapshot>(`/api/payments/status?orderId=${encodeURIComponent(orderId)}`);
  const result = known(snapshot.payment, snapshot.order);
  if (result) return result;
  if (!snapshot.payment) return { kind: "pending", message: "This order is awaiting payment. No payment has been confirmed." };
  const reconciled = await api<{ payment: Payment }>(`/api/payments/${snapshot.payment.id}/reconcile`, {});
  return known(reconciled.payment) ?? { kind: "pending", message: "Payment has not been confirmed. You can retry the same order after checking your bank or payment app." };
}

async function start(orderId: string, phase: (value: CheckoutPhase) => void): Promise<CheckoutResult> {
  phase("preparing");
  const config = await api<{ enabled: boolean; mode: string }>("/api/payments/config");
  if (!config.enabled || config.mode !== "test") throw new Error("Online test checkout is unavailable. Your existing order is retained.");
  // Always reconcile before reopening a previously attempted order, including after a reload.
  const snapshot = await api<Snapshot>(`/api/payments/status?orderId=${encodeURIComponent(orderId)}`);
  const current = known(snapshot.payment, snapshot.order);
  if (current) return current;
  if (snapshot.order.status !== "PLACED") throw new Error("This order is not eligible for payment.");
  if (snapshot.payment) {
    const reconciled = await api<{ payment: Payment }>(`/api/payments/${snapshot.payment.id}/reconcile`, {});
    const terminal = known(reconciled.payment); if (terminal) return terminal;
  }
  const { payment } = await api<{ payment: Payment }>("/api/payments/orders", { orderId });
  const terminal = known(payment); if (terminal) return terminal;
  if (payment.orderId !== orderId || !payment.keyId || !/^rzp_test_[A-Za-z0-9]+$/.test(payment.keyId) || !payment.providerOrderId || !/^order_[A-Za-z0-9]+$/.test(payment.providerOrderId) || payment.currency !== "INR" || !Number.isSafeInteger(payment.amount) || payment.amount <= 0) throw new Error("We could not safely prepare this payment. Your order is saved; no payment window was opened.");
  phase("loading");
  const Checkout = await loadCheckoutSdk();
  return new Promise(resolve => {
    let finished = false;
    let verifying = false;
    const finish = (result: CheckoutResult) => { if (!finished) { finished = true; resolve(result); } };
    const checkout = new Checkout({
      key: payment.keyId!, amount: payment.amount, currency: "INR", order_id: payment.providerOrderId!, name: "SHAIKH'S", description: "Test payment — no real money",
      theme: { color: "#C9511C" }, retry: { enabled: false },
      modal: { animation: !window.matchMedia("(prefers-reduced-motion: reduce)").matches, ondismiss: () => { if (!verifying) finish({ kind: "cancelled", message: "Payment window closed. Your order is saved; check status before retrying." }); } },
      handler: async response => {
        if (verifying || finished) return;
        verifying = true; phase("verifying");
        try {
          const confirmed = await api<{ payment: Payment }>(`/api/payments/${payment.id}/verify`, { razorpay_order_id: response.razorpay_order_id, razorpay_payment_id: response.razorpay_payment_id, razorpay_signature: response.razorpay_signature });
          finish(known(confirmed.payment) ?? { kind: "pending", message: "Awaiting verified capture. Do not pay again; check payment status shortly." });
        } catch { finish({ kind: "uncertain", message: "Confirmation was interrupted. Do not pay again yet; check status to recover the existing payment." }); }
        finally { checkout.close(); }
      },
    });
    checkout.on("payment.failed", () => { if (!verifying && !finished) { finish({ kind: "failed", message: "The payment attempt did not complete. Check status before retrying this order." }); checkout.close(); } });
    phase("open"); checkout.open();
  });
}

export async function startOnlinePayment(orderId: string, phase: (value: CheckoutPhase) => void): Promise<CheckoutResult> {
  const run = async () => {
    if (active) throw new Error("A payment window is already active. Finish it before retrying.");
    active = true;
    try { return await start(orderId, phase); } finally { active = false; }
  };
  if (navigator.locks) return navigator.locks.request("shaikhs-razorpay-checkout", { ifAvailable: true }, lock => { if (!lock) throw new Error("A payment window is open in another tab."); return run(); });
  return run();
}
