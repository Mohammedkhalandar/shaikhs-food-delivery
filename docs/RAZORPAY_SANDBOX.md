# Razorpay test checkout acceptance

The customer UI is implemented. It stays disabled until **both** test credentials and `RAZORPAY_SANDBOX_VERIFIED=true` are configured on the server. That flag is an operator attestation after this checklist, not something mocks or this session enable. Live keys are rejected. No existing database needs to be modified.

## What you must provide

In Razorpay Dashboard select **Test mode**, then Account/Settings → API Keys → Generate Key. Save the Test Key ID and Key Secret privately; the secret is shown when generated. See [official API-key instructions](https://razorpay.com/docs/payments/dashboard/account-settings/api-keys/).

| Server setting | Required value |
| --- | --- |
| RAZORPAY_TEST_ENABLED | `true` only in your isolated verification environment |
| RAZORPAY_KEY_ID | Your actual `rzp_test_...` Key ID; this public key alone reaches Checkout |
| RAZORPAY_KEY_SECRET | Matching Test Key Secret; server only |
| RAZORPAY_WEBHOOK_SECRET | A separate random 32+ character secret, also entered in the TEST webhook settings |
| RAZORPAY_SANDBOX_VERIFIED | Keep `false` during initial acceptance; set `true` only after all checks below pass |
| APP_URL | Exact origin of your approved test site, including scheme and port |
| DATABASE_URL | Dedicated disposable PostgreSQL database, never the existing application database |
| JWT_SECRET | Unique 32+ character secret for that test environment |

Do not use NEXT_PUBLIC variables, paste secrets into browser code/chat, commit them, or supply live credentials. No actual merchant keys were available in this session.

## Webhook setup

Arrange an **approved, externally reachable HTTPS test endpoint**; this work does not publish a site or open a tunnel. Configure the TEST-mode webhook URL as `https://YOUR_APPROVED_TEST_HOST/api/webhooks/razorpay` without credentials/query secrets. Set the matching webhook secret and subscribe to:

- `payment.captured`, `payment.failed`
- `refund.created`, `refund.processed`, `refund.failed`

Preserve raw request bytes through proxies. This exact POST authenticates via HMAC and does not need browser Origin; other payment writes still require the same-origin session. Configure provider capture settings appropriately: authorized alone is not credited. See [webhook validation](https://razorpay.com/docs/webhooks/validate-test/) and [Checkout integration](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps/).

## Verify before opening the public UI gate

1. Create a NEW local database named `shaikhs_disposable_...` and migrate it using the safe workflow in [TESTING.md](TESTING.md). In the test server terminal set DATABASE_URL to that database, the settings above, and keep RAZORPAY_SANDBOX_VERIFIED=false. Build/start the app; `/api/health/ready` must return 200 and `/api/payments/config` must say enabled=false.
2. In another terminal set TEST_DATABASE_URL to the **same** disposable URL. Set SANDBOX_CUSTOMER_EMAIL to a **new** `...@example.test` address and SANDBOX_CUSTOMER_PASSWORD to a private test-only password (12+ characters, at most 72 UTF-8 bytes). Run `npm run sandbox:prepare`. It creates only synthetic records, prints an application order ID and exact 24511 paise total, never prints passwords and never calls Razorpay. It refuses real/nonlocal database names and never updates an existing customer. Remove the password environment variable afterwards.
3. The public UI **and provider-order API** remain gated. In a private operator terminal set TEST_DATABASE_URL, SANDBOX_ORDER_ID to the printed fixture ID, and the same real TEST credentials/webhook secret as the server. Run `npm run sandbox:provider`. This guarded local command accepts only synthetic SANDBOX orders in a local disposable database, creates/recovers the provider order and prints public test key/IDs/amount only. It never changes the gate. If it times out, retry the same fixture to recover its durable receipt, not a new order.
4. Sign in to the test site as that fixture customer. For the initial operator-only probe, paste the printed **payment object** into the following in that site's browser console. No merchant secret belongs here:

```javascript
const payment = PASTE_PRINTED_PUBLIC_PAYMENT_OBJECT;
const post = async (path, data = {}) => {
  const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const result = await r.json(); if (!r.ok) throw new Error(result.error); return result;
};
if (!/^rzp_test_[A-Za-z0-9]+$/.test(payment.keyId)) throw new Error('Test key required');
if (!window.Razorpay) await new Promise((resolve, reject) => {
  const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js';
  s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
});
let confirming = false;
const checkout = new Razorpay({
  key: payment.keyId, amount: payment.amount, currency: 'INR', order_id: payment.providerOrderId,
  name: "SHAIKH'S", description: 'Isolated test acceptance — no real money', retry: { enabled: false },
  handler: async response => {
    if (confirming) return; confirming = true;
    const result = await post(`/api/payments/${payment.id}/verify`, {
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature
    });
    console.info('Verified backend state:', result.payment.state);
  }
});
checkout.open();
```

5. Use only Razorpay's published **test** payment instruments. Confirm the provider order is exactly INR 245.11, captured in TEST mode, and the app records PAID only after verified capture. Use `POST /api/payments/{payment.id}/reconcile` (the `post` helper above) to recover interrupted confirmations. Never open another payment while authorization is pending.
6. Confirm the TEST webhook reaches the site with valid signatures. Replay the same provider event and verify one PaymentEvent and one capture audit, no second financial credit. Invalid signatures must return 401; wrong amounts/ownership must not change state. Test failure, dismissal, a lost callback response and out-of-order delivery. Use a fresh helper fixture email for another order rather than resetting data.
7. Privately provision a **separate ADMIN fixture in this disposable database only** for the refund test (for example, register another test account and set that new fixture's role using Prisma Studio connected explicitly to TEST_DATABASE_URL). As that admin, POST `/api/payments/{payment.id}/refund`; it refunds the full server amount with a durable idempotency key. Pending/failed refunds must retain PAID; processed refunds must show REFUNDED and leave verified revenue. Repeat/reconcile without issuing a second refund. Do not edit real accounts or production data.
8. Record the provider order/payment/refund IDs, event IDs, outcomes, amount and date; **exclude secrets, passwords and raw customer/card data**. Once backend capture, webhook, retry and refund checks pass, set RAZORPAY_SANDBOX_VERIFIED=true on that isolated test server and restart it. `/api/payments/config` should now enable TEST checkout. Exercise the actual customer UI end-to-end, including mobile, dismiss/failure/retry and bank-pending states. If any check fails, set the flag back to false.

This is test-mode acceptance, not production authorization. The site will still reject live keys. The SDK iframe, real provider delivery/capture/refund behavior and merchant configuration remain unverified until you perform these steps.

## Local automated coverage

`npm run test:checkout-ui` exercises the real React UI with a mocked SDK/API and signed callback fixtures: gate, success, failed/dismissed payments, retries/reload, duplicate callbacks/clicks, SDK loading failure, interrupted confirmation, pending authorization, stale gate, cross-tab locking, three widths and axe. `npm run test:payments` uses a disposable PostgreSQL URL for signatures, ownership, duplicate webhooks, refunds and reconciliation. These tests never attest actual sandbox acceptance.
